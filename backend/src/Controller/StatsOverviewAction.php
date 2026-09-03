<?php

namespace App\Controller;

use App\Entity\Attempt;
use App\Entity\CyclePuzzle;
use App\Entity\Training;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Repository\CyclePuzzleRepository;
use App\Repository\CycleRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class StatsOverviewAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingRepository $trainingRepository,
        private readonly TrainingPuzzleRepository $trainingPuzzleRepository,
        private readonly CycleRepository $cycleRepository,
        private readonly CyclePuzzleRepository $cyclePuzzleRepository,
        private readonly AttemptRepository $attemptRepository,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        $trainings = $this->trainingRepository->findOwnedByUserOrdered($user);
        $trainingBreakdown = array_map(fn (Training $training): array => $this->buildTrainingCard($training), $trainings);

        $trainingCount = count($trainingBreakdown);
        $progressDeltas = array_values(array_filter(
            array_map(fn (array $summary): ?int => $summary['progressDelta'] ?? null, $trainingBreakdown),
            static fn (?int $value): bool => null !== $value,
        ));
        $puzzleCount = array_sum(array_column($trainingBreakdown, 'puzzleCount'));
        $attemptCount = array_sum(array_column($trainingBreakdown, 'attemptCount'));
        $successfulAttemptCount = array_sum(array_column($trainingBreakdown, 'successfulAttemptCount'));
        $totalDurationMilliseconds = array_sum(array_column($trainingBreakdown, 'durationMilliseconds'));
        $solvedCyclePuzzleCount = array_sum(array_column($trainingBreakdown, 'solvedCount'));
        $failedCyclePuzzleCount = array_sum(array_column($trainingBreakdown, 'failedCount'));
        $rescuedCyclePuzzleCount = array_sum(array_column($trainingBreakdown, 'rescuedCount'));
        $unresolvedCyclePuzzleCount = array_sum(array_column($trainingBreakdown, 'unresolvedCount'));
        $pendingCyclePuzzleCount = array_sum(array_column($trainingBreakdown, 'pendingCount'));
        $completedCyclePuzzleCount = array_sum(array_column($trainingBreakdown, 'completedPuzzleCount'));
        $puzzlesWithCompletedAttemptsCount = array_sum(array_column($trainingBreakdown, 'puzzlesWithCompletedAttemptsCount'));
        $completedAttemptCount = array_sum(array_column($trainingBreakdown, 'completedAttemptCount'));
        $activeCycleCount = count(array_filter(
            $trainingBreakdown,
            fn (array $summary): bool => 'active' === ($summary['latestCycleStatus'] ?? null),
        ));
        $completedCycleCount = count(array_filter(
            $trainingBreakdown,
            fn (array $summary): bool => 'completed' === ($summary['latestCycleStatus'] ?? null),
        ));
        $resumableTrainingCount = count(array_filter(
            $trainingBreakdown,
            fn (array $summary): bool => true === $summary['hasResumableCycle'],
        ));
        $latestAttemptedAt = null;
        $totalMistakes = 0;

        foreach ($trainings as $training) {
            $attempts = $this->attemptRepository->findByTrainingOrdered($training);

            foreach ($attempts as $attempt) {
                if ('in_progress' !== $attempt->getStatus()) {
                    $totalMistakes += $attempt->getMistakesCount();
                }

                $attemptedAt = $attempt->getAttemptedAt();
                if ($attemptedAt instanceof \DateTimeImmutable && (null === $latestAttemptedAt || $attemptedAt > $latestAttemptedAt)) {
                    $latestAttemptedAt = $attemptedAt;
                }
            }
        }

        $evaluatedCyclePuzzleCount = $solvedCyclePuzzleCount + $failedCyclePuzzleCount;

        $payload = [
            'trainingCount' => $trainingCount,
            'puzzleCount' => $puzzleCount,
            'attemptCount' => $attemptCount,
            'completedAttemptCount' => $completedAttemptCount,
            'averageAttempts' => $puzzlesWithCompletedAttemptsCount > 0 ? round($completedAttemptCount / $puzzlesWithCompletedAttemptsCount, 1) : 0,
            'progressPercent' => count($progressDeltas) > 0 ? (int) round(array_sum($progressDeltas) / count($progressDeltas)) : 0,
            'totalDurationMilliseconds' => $totalDurationMilliseconds,
            'successfulAttemptCount' => $successfulAttemptCount,
            'successRate' => $evaluatedCyclePuzzleCount > 0 ? (int) round(($solvedCyclePuzzleCount / $evaluatedCyclePuzzleCount) * 100) : 0,
            'averageMistakes' => $completedAttemptCount > 0 ? round($totalMistakes / $completedAttemptCount, 1) : 0,
            'activeCycleCount' => $activeCycleCount,
            'completedCycleCount' => $completedCycleCount,
            'resumableTrainingCount' => $resumableTrainingCount,
            'solvedCyclePuzzleCount' => $solvedCyclePuzzleCount,
            'failedCyclePuzzleCount' => $failedCyclePuzzleCount,
            'rescuedCyclePuzzleCount' => $rescuedCyclePuzzleCount,
            'unresolvedCyclePuzzleCount' => $unresolvedCyclePuzzleCount,
            'pendingCyclePuzzleCount' => $pendingCyclePuzzleCount,
            'latestAttemptedAt' => $latestAttemptedAt?->format(DATE_ATOM),
            'trainingBreakdown' => $trainingBreakdown,
        ];

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildTrainingCard(Training $training): array
    {
        $trainingPuzzles = $this->trainingPuzzleRepository->findByTrainingWithPuzzleOrdered($training);
        $cycles = $this->cycleRepository->findByTrainingOrdered($training);
        $cyclePuzzles = $this->cyclePuzzleRepository->findByTrainingOrdered($training);
        $attempts = $this->attemptRepository->findByTrainingOrdered($training);

        $latestCycle = count($cycles) > 0 ? $cycles[array_key_last($cycles)] : null;
        $latestAttempt = count($attempts) > 0 ? $attempts[0] : null;
        $attemptsByCyclePuzzle = [];
        $handledCyclePuzzleIds = [];
        $dailyActivity = [];

        foreach ($attempts as $attempt) {
            $cyclePuzzleId = $attempt->getCyclePuzzle()?->getId();
            if (null !== $cyclePuzzleId) {
                $attemptsByCyclePuzzle[$cyclePuzzleId][] = $attempt;
                $handledCyclePuzzleIds[$cyclePuzzleId] = true;
            }

            $day = $attempt->getAttemptedAt()?->format('Y-m-d');
            if (null === $day || 'in_progress' === $attempt->getStatus()) {
                continue;
            }

            if (!isset($dailyActivity[$day])) {
                $dailyActivity[$day] = [
                    'attemptCount' => 0,
                    'date' => $day,
                    'durationMilliseconds' => 0,
                    'handledPuzzleIds' => [],
                    'successfulAttemptCount' => 0,
                ];
            }

            $dailyActivity[$day]['attemptCount'] += 1;
            $dailyActivity[$day]['durationMilliseconds'] += $attempt->getDurationMilliseconds();
            $dailyActivity[$day]['successfulAttemptCount'] += 'solved' === $attempt->getStatus() ? 1 : 0;
            if (null !== $cyclePuzzleId) {
                $dailyActivity[$day]['handledPuzzleIds'][$cyclePuzzleId] = true;
            }
        }

        $solved = 0;
        $failed = 0;
        $rescued = 0;
        $unresolved = 0;
        $pending = 0;
        $completedPuzzleCount = 0;
        $puzzlesWithCompletedAttemptsCount = 0;
        $completedAttemptCount = 0;
        $successfulAttemptCount = 0;
        $durationMilliseconds = 0;
        $successRatesByCycle = [];

        $cyclePuzzlesByCycle = [];
        foreach ($cyclePuzzles as $cyclePuzzle) {
            $cycleId = $cyclePuzzle->getCycle()?->getId();
            if (null !== $cycleId) {
                $cyclePuzzlesByCycle[$cycleId][] = $cyclePuzzle;
            }
            $cyclePuzzleId = $cyclePuzzle->getId() ?? 0;
            $cyclePuzzleAttempts = $attemptsByCyclePuzzle[$cyclePuzzleId] ?? [];
            $completedAttemptsForPuzzle = array_values(array_filter(
                $cyclePuzzleAttempts,
                fn (Attempt $attempt): bool => 'in_progress' !== $attempt->getStatus(),
            ));
            $hasSolvedAttempt = count(array_filter(
                $cyclePuzzleAttempts,
                fn (Attempt $attempt): bool => 'solved' === $attempt->getStatus(),
            )) > 0;

            if ('solved' === $cyclePuzzle->getStatus()) {
                $solved += 1;
            } elseif ('failed' === $cyclePuzzle->getStatus()) {
                $failed += 1;
                if ($hasSolvedAttempt) {
                    $rescued += 1;
                } else {
                    $unresolved += 1;
                }
            } else {
                $pending += 1;
            }

            if ('solved' === $cyclePuzzle->getStatus() || ('failed' === $cyclePuzzle->getStatus() && $hasSolvedAttempt)) {
                $completedPuzzleCount += 1;
            }

            if (count($completedAttemptsForPuzzle) > 0) {
                $puzzlesWithCompletedAttemptsCount += 1;
                $completedAttemptCount += count($completedAttemptsForPuzzle);
            }

            $successfulAttemptCount += count(array_filter(
                $completedAttemptsForPuzzle,
                fn (Attempt $attempt): bool => 'solved' === $attempt->getStatus(),
            ));
            $durationMilliseconds += $cyclePuzzle->getDurationMilliseconds();
        }

        foreach (array_reverse($cycles) as $cycle) {
            $cycleId = $cycle->getId() ?? 0;
            $cycleCyclePuzzles = $cyclePuzzlesByCycle[$cycleId] ?? [];
            $cycleSolved = count(array_filter($cycleCyclePuzzles, fn (CyclePuzzle $cyclePuzzle): bool => 'solved' === $cyclePuzzle->getStatus()));
            $cycleFailed = count(array_filter($cycleCyclePuzzles, fn (CyclePuzzle $cyclePuzzle): bool => 'failed' === $cyclePuzzle->getStatus()));
            $successRatesByCycle[] = ($cycleSolved + $cycleFailed) > 0 ? (int) round(($cycleSolved / ($cycleSolved + $cycleFailed)) * 100) : 0;
        }

        $progressDelta = count($successRatesByCycle) > 1 ? $successRatesByCycle[0] - $successRatesByCycle[1] : null;

        ksort($dailyActivity);

        return [
            'training' => $this->normalizeTraining($training),
            'puzzleCount' => count($trainingPuzzles),
            'attemptCount' => count($attempts),
            'completedAttemptCount' => $completedAttemptCount,
            'averageAttempts' => $puzzlesWithCompletedAttemptsCount > 0 ? round($completedAttemptCount / $puzzlesWithCompletedAttemptsCount, 1) : 0,
            'dailyActivity' => array_map(
                fn (array $point): array => [
                    'attemptCount' => $point['attemptCount'],
                    'date' => $point['date'],
                    'durationMilliseconds' => $point['durationMilliseconds'],
                    'handledPuzzleCount' => count($point['handledPuzzleIds']),
                    'successfulAttemptCount' => $point['successfulAttemptCount'],
                ],
                array_values($dailyActivity),
            ),
            'durationMilliseconds' => $durationMilliseconds,
            'progressPercent' => count($trainingPuzzles) > 0 ? (int) round((($solved + $failed) / count($trainingPuzzles)) * 100) : 0,
            'progressDelta' => $progressDelta,
            'completedPuzzleCount' => $completedPuzzleCount,
            'solvedCount' => $solved,
            'successfulAttemptCount' => $successfulAttemptCount,
            'successRate' => ($solved + $failed) > 0 ? (int) round(($solved / ($solved + $failed)) * 100) : 0,
            'failedCount' => $failed,
            'rescuedCount' => $rescued,
            'resolvedPuzzleCount' => $solved + $rescued,
            'unresolvedCount' => $unresolved,
            'pendingCount' => $pending,
            'puzzlesWithCompletedAttemptsCount' => $puzzlesWithCompletedAttemptsCount,
            'latestCycleNumber' => $latestCycle?->getNumber(),
            'latestCycleStatus' => $latestCycle?->getStatus(),
            'hasResumableCycle' => $latestCycle?->getStatus() === 'active' && $pending > 0,
            'latestAttemptedAt' => $latestAttempt instanceof Attempt ? $latestAttempt->getAttemptedAt()?->format(DATE_ATOM) : null,
            'descriptionReady' => '' !== trim($training->getDescription() ?? ''),
            'activeDays' => count($dailyActivity),
            'handledPuzzleCount' => count($handledCyclePuzzleIds),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeTraining(Training $training): array
    {
        return [
            '@id' => sprintf('/api/trainings/%d', $training->getId()),
            'id' => $training->getId(),
            'name' => $training->getName(),
            'description' => $training->getDescription(),
            'icon' => $training->getIcon(),
            'iconBackgroundColor' => $training->getIconBackgroundColor(),
            'iconColor' => $training->getIconColor(),
            'logo' => $training->getLogo(),
            'status' => $training->getStatus(),
            'mistakeLimit' => $training->getMistakeLimit(),
            'createdAt' => $training->getCreatedAt()?->format(DATE_ATOM),
        ];
    }
}
