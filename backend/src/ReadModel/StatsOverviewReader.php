<?php

namespace App\ReadModel;

use App\Entity\Attempt;
use App\Entity\CyclePuzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Repository\CyclePuzzleRepository;
use App\Repository\CycleRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;

final class StatsOverviewReader
{
    public function __construct(
        private readonly TrainingRepository $trainingRepository,
        private readonly TrainingPuzzleRepository $trainingPuzzleRepository,
        private readonly CycleRepository $cycleRepository,
        private readonly CyclePuzzleRepository $cyclePuzzleRepository,
        private readonly AttemptRepository $attemptRepository,
    ) {
    }

    /** @return array<string, mixed> */
    public function build(User $user): array
    {
        $trainings = $this->trainingRepository->findOwnedByUserOrdered($user);
        $summaries = array_map(fn (Training $training): array => $this->buildTrainingSummary($training), $trainings);
        $trainingBreakdown = array_column($summaries, 'card');

        $trainingCount = count($trainingBreakdown);
        $progressValues = array_values(array_filter(
            array_map(
                static fn (array $summary): ?int => $summary['progressSinceCycleOne'] ?? null,
                $trainingBreakdown,
            ),
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
        $activeTrainingSummaries = array_values(array_filter(
            $trainingBreakdown,
            static fn (array $summary): bool => ($summary['handledPuzzleCount'] ?? 0) > 0,
        ));
        $trainingSuccessRates = array_reduce(
            $activeTrainingSummaries,
            static fn (array $values, array $summary): array => [...$values, ...($summary['cycleSuccessRates'] ?? [])],
            [],
        );
        $trainingAverageAttempts = array_reduce(
            $activeTrainingSummaries,
            static fn (array $values, array $summary): array => [...$values, ...($summary['cycleAverageAttempts'] ?? [])],
            [],
        );
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

        foreach ($summaries as $summary) {
            $totalMistakes += $summary['totalMistakes'];
            $attemptedAt = $summary['latestAttemptedAt'];
            if ($attemptedAt instanceof \DateTimeImmutable && (null === $latestAttemptedAt || $attemptedAt > $latestAttemptedAt)) {
                $latestAttemptedAt = $attemptedAt;
            }
        }

        $payload = [
            'trainingCount' => $trainingCount,
            'puzzleCount' => $puzzleCount,
            'attemptCount' => $attemptCount,
            'completedAttemptCount' => $completedAttemptCount,
            'averageAttempts' => count($trainingAverageAttempts) > 0 ? round(array_sum($trainingAverageAttempts) / count($trainingAverageAttempts), 1) : 0,
            'progressPercent' => count($progressValues) > 0 ? (int) round(array_sum($progressValues) / count($progressValues)) : 0,
            'totalDurationMilliseconds' => $totalDurationMilliseconds,
            'successfulAttemptCount' => $successfulAttemptCount,
            'successRate' => count($trainingSuccessRates) > 0 ? (int) round(array_sum($trainingSuccessRates) / count($trainingSuccessRates)) : 0,
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

        return $payload;
    }

    /**
     * @return array{card: array<string, mixed>, totalMistakes: int, latestAttemptedAt: ?\DateTimeImmutable}
     */
    private function buildTrainingSummary(Training $training): array
    {
        $trainingPuzzles = $this->trainingPuzzleRepository->findByTrainingWithPuzzleOrdered($training);
        $cycles = $this->cycleRepository->findByTrainingOrdered($training);
        $cyclePuzzles = $this->cyclePuzzleRepository->findByTrainingOrdered($training);
        $attempts = $this->attemptRepository->findByTrainingOrdered($training);

        $latestCycle = count($cycles) > 0 ? $cycles[array_key_last($cycles)] : null;
        $latestAttempt = count($attempts) > 0 ? $attempts[0] : null;
        $attemptsByCyclePuzzle = [];
        $handledCyclePuzzleIds = [];
        $handledTrainingPuzzleIds = [];
        $dailyActivity = [];

        $totalMistakes = 0;
        $latestAttemptedAt = null;
        foreach ($attempts as $attempt) {
            if ('in_progress' !== $attempt->getStatus()) {
                $totalMistakes += $attempt->getMistakesCount();
            }
            $attemptedAt = $attempt->getAttemptedAt();
            if ($attemptedAt instanceof \DateTimeImmutable && (null === $latestAttemptedAt || $attemptedAt > $latestAttemptedAt)) {
                $latestAttemptedAt = $attemptedAt;
            }
            $cyclePuzzleId = $attempt->getCyclePuzzle()?->getId();
            if (null !== $cyclePuzzleId) {
                $attemptsByCyclePuzzle[$cyclePuzzleId][] = $attempt;
                $handledCyclePuzzleIds[$cyclePuzzleId] = true;
                $trainingPuzzleId = $attempt->getCyclePuzzle()?->getTrainingPuzzle()?->getId();
                if (null !== $trainingPuzzleId) {
                    $handledTrainingPuzzleIds[$trainingPuzzleId] = true;
                }
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
        $cycleAverageAttempts = [];

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
            if (($cycleSolved + $cycleFailed) > 0) {
                $successRatesByCycle[] = (int) round(($cycleSolved / ($cycleSolved + $cycleFailed)) * 100);
                $cycleAttemptCount = 0;
                $cyclePuzzleCountWithAttempts = 0;
                foreach ($cycleCyclePuzzles as $cyclePuzzle) {
                    $completedAttempts = array_filter(
                        $attemptsByCyclePuzzle[$cyclePuzzle->getId() ?? 0] ?? [],
                        static fn (Attempt $attempt): bool => 'in_progress' !== $attempt->getStatus(),
                    );
                    if (count($completedAttempts) > 0) {
                        $cyclePuzzleCountWithAttempts++;
                        $cycleAttemptCount += count($completedAttempts);
                    }
                }
                if ($cyclePuzzleCountWithAttempts > 0) {
                    $cycleAverageAttempts[] = round($cycleAttemptCount / $cyclePuzzleCountWithAttempts, 1);
                }
            }
        }

        $progressDelta = count($successRatesByCycle) > 1 ? $successRatesByCycle[0] - $successRatesByCycle[1] : null;
        $latestCyclePuzzles = $latestCycle ? ($cyclePuzzlesByCycle[$latestCycle->getId() ?? 0] ?? []) : [];
        $latestSolved = count(array_filter($latestCyclePuzzles, static fn (CyclePuzzle $cyclePuzzle): bool => 'solved' === $cyclePuzzle->getStatus()));
        $latestFailed = count(array_filter($latestCyclePuzzles, static fn (CyclePuzzle $cyclePuzzle): bool => 'failed' === $cyclePuzzle->getStatus()));
        $latestSuccessRate = ($latestSolved + $latestFailed) > 0
            ? (int) round(($latestSolved / ($latestSolved + $latestFailed)) * 100)
            : 0;
        $cycleOne = $cycles[0] ?? null;
        $cycleOnePuzzles = $cycleOne ? ($cyclePuzzlesByCycle[$cycleOne->getId() ?? 0] ?? []) : [];
        $cycleOneSolved = count(array_filter($cycleOnePuzzles, static fn (CyclePuzzle $cyclePuzzle): bool => 'solved' === $cyclePuzzle->getStatus()));
        $cycleOneFailed = count(array_filter($cycleOnePuzzles, static fn (CyclePuzzle $cyclePuzzle): bool => 'failed' === $cyclePuzzle->getStatus()));
        $cycleOneSuccessRate = ($cycleOneSolved + $cycleOneFailed) > 0
            ? (int) round(($cycleOneSolved / ($cycleOneSolved + $cycleOneFailed)) * 100)
            : null;
        $progressSinceCycleOne = null !== $cycleOneSuccessRate && ($latestSolved + $latestFailed) > 0
            ? $latestSuccessRate - $cycleOneSuccessRate
            : null;
        $ratings = array_values(array_filter(
            array_map(
                static fn (TrainingPuzzle $trainingPuzzle): ?int => $trainingPuzzle->getCyclePuzzles()->count() > 0
                    ? $trainingPuzzle->getPuzzle()?->getRating()
                    : null,
                $trainingPuzzles,
            ),
            static fn (?int $rating): bool => null !== $rating,
        ));

        ksort($dailyActivity);

        $card = [
            'training' => $this->normalizeTraining($training),
            'puzzleCount' => count($trainingPuzzles),
            'averageRating' => count($ratings) > 0 ? (int) round(array_sum($ratings) / count($ratings)) : null,
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
            'progressPercent' => count($trainingPuzzles) > 0 ? (int) round((count($handledTrainingPuzzleIds) / count($trainingPuzzles)) * 100) : 0,
            'progressDelta' => $progressDelta,
            'completedPuzzleCount' => $completedPuzzleCount,
            'solvedCount' => $solved,
            'successfulAttemptCount' => $successfulAttemptCount,
            'successRate' => $latestSuccessRate,
            'latestCycleHasCompletedPuzzles' => ($latestSolved + $latestFailed) > 0,
            'cycleOneHasCompletedPuzzles' => ($cycleOneSolved + $cycleOneFailed) > 0,
            'progressSinceCycleOne' => $progressSinceCycleOne,
            'cycleSuccessRates' => $successRatesByCycle,
            'cycleAverageAttempts' => $cycleAverageAttempts,
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
            'handledPuzzleCount' => count($handledTrainingPuzzleIds),
        ];

        return ['card' => $card, 'totalMistakes' => $totalMistakes, 'latestAttemptedAt' => $latestAttemptedAt];
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
