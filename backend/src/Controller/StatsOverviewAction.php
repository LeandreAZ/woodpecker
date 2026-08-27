<?php

namespace App\Controller;

use App\Entity\Attempt;
use App\Entity\Cycle;
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
        $puzzleCount = array_sum(array_column($trainingBreakdown, 'puzzleCount'));
        $attemptCount = array_sum(array_column($trainingBreakdown, 'attemptCount'));
        $successfulAttemptCount = array_sum(array_column($trainingBreakdown, 'successfulAttemptCount'));
        $totalDurationMilliseconds = array_sum(array_column($trainingBreakdown, 'durationMilliseconds'));
        $solvedCyclePuzzleCount = array_sum(array_column($trainingBreakdown, 'solvedCount'));
        $failedCyclePuzzleCount = array_sum(array_column($trainingBreakdown, 'failedCount'));
        $pendingCyclePuzzleCount = array_sum(array_column($trainingBreakdown, 'pendingCount'));
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
                $totalMistakes += $attempt->getMistakesCount();
                $attemptedAt = $attempt->getAttemptedAt();
                if ($attemptedAt instanceof \DateTimeImmutable && (null === $latestAttemptedAt || $attemptedAt > $latestAttemptedAt)) {
                    $latestAttemptedAt = $attemptedAt;
                }
            }
        }

        $payload = [
            'trainingCount' => $trainingCount,
            'puzzleCount' => $puzzleCount,
            'attemptCount' => $attemptCount,
            'totalDurationMilliseconds' => $totalDurationMilliseconds,
            'successfulAttemptCount' => $successfulAttemptCount,
            'successRate' => $attemptCount > 0 ? (int) round(($successfulAttemptCount / $attemptCount) * 100) : 0,
            'averageMistakes' => $attemptCount > 0 ? round($totalMistakes / $attemptCount, 1) : 0,
            'activeCycleCount' => $activeCycleCount,
            'completedCycleCount' => $completedCycleCount,
            'resumableTrainingCount' => $resumableTrainingCount,
            'solvedCyclePuzzleCount' => $solvedCyclePuzzleCount,
            'failedCyclePuzzleCount' => $failedCyclePuzzleCount,
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
        $previousCycle = count($cycles) > 1 ? $cycles[count($cycles) - 2] : null;
        $latestCyclePuzzles = $latestCycle instanceof Cycle
            ? array_values(array_filter(
                $cyclePuzzles,
                fn (CyclePuzzle $cyclePuzzle): bool => $cyclePuzzle->getCycle()?->getId() === $latestCycle->getId(),
            ))
            : [];
        $previousCyclePuzzles = $previousCycle instanceof Cycle
            ? array_values(array_filter(
                $cyclePuzzles,
                fn (CyclePuzzle $cyclePuzzle): bool => $cyclePuzzle->getCycle()?->getId() === $previousCycle->getId(),
            ))
            : [];

        $solved = count(array_filter(
            $latestCyclePuzzles,
            fn (CyclePuzzle $cyclePuzzle): bool => 'solved' === $cyclePuzzle->getStatus(),
        ));
        $failed = count(array_filter(
            $latestCyclePuzzles,
            fn (CyclePuzzle $cyclePuzzle): bool => 'failed' === $cyclePuzzle->getStatus(),
        ));
        $pending = count(array_filter(
            $latestCyclePuzzles,
            fn (CyclePuzzle $cyclePuzzle): bool => 'pending' === $cyclePuzzle->getStatus(),
        ));
        $total = count($latestCyclePuzzles);
        $progressPercent = $total > 0 ? (int) round(($solved / $total) * 100) : 0;
        $previousProgressPercent = $this->buildCycleProgress($previousCyclePuzzles);
        $latestAttempt = count($attempts) > 0 ? $attempts[0] : null;
        $successfulAttemptCount = count(array_filter(
            $attempts,
            fn (Attempt $attempt): bool => $attempt->isSuccessful(),
        ));
        $durationMilliseconds = array_sum(array_map(
            fn (Attempt $attempt): int => $attempt->getDurationMilliseconds(),
            $attempts,
        ));
        $handledCyclePuzzleIds = [];
        $dailyActivity = [];

        foreach ($attempts as $attempt) {
            $cyclePuzzleId = $attempt->getCyclePuzzle()?->getId();
            if (null !== $cyclePuzzleId) {
                $handledCyclePuzzleIds[$cyclePuzzleId] = true;
            }

            $day = $attempt->getAttemptedAt()?->format('Y-m-d');
            if (null === $day) {
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
            $dailyActivity[$day]['successfulAttemptCount'] += $attempt->isSuccessful() ? 1 : 0;
            if (null !== $cyclePuzzleId) {
                $dailyActivity[$day]['handledPuzzleIds'][$cyclePuzzleId] = true;
            }
        }

        ksort($dailyActivity);

        return [
            'training' => $this->normalizeTraining($training),
            'puzzleCount' => count($trainingPuzzles),
            'attemptCount' => count($attempts),
            'averageAttempts' => count($handledCyclePuzzleIds) > 0 ? round(count($attempts) / count($handledCyclePuzzleIds), 1) : 0,
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
            'progressPercent' => $progressPercent,
            'progressDelta' => $progressPercent - $previousProgressPercent,
            'solvedCount' => $solved,
            'successfulAttemptCount' => $successfulAttemptCount,
            'successRate' => count($attempts) > 0 ? (int) round(($successfulAttemptCount / count($attempts)) * 100) : 0,
            'failedCount' => $failed,
            'pendingCount' => $pending,
            'latestCycleNumber' => $latestCycle?->getNumber(),
            'latestCycleStatus' => $latestCycle?->getStatus(),
            'hasResumableCycle' => $latestCycle?->getStatus() === 'active' && $pending > 0,
            'latestAttemptedAt' => $latestAttempt instanceof Attempt ? $latestAttempt->getAttemptedAt()?->format(DATE_ATOM) : null,
            'descriptionReady' => '' !== trim($training->getDescription() ?? ''),
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

    /**
     * @param list<CyclePuzzle> $cyclePuzzles
     */
    private function buildCycleProgress(array $cyclePuzzles): int
    {
        $total = count($cyclePuzzles);
        if (0 === $total) {
            return 0;
        }

        $solved = count(array_filter(
            $cyclePuzzles,
            fn (CyclePuzzle $cyclePuzzle): bool => 'solved' === $cyclePuzzle->getStatus(),
        ));

        return (int) round(($solved / $total) * 100);
    }
}
