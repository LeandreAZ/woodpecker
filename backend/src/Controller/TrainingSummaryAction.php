<?php

namespace App\Controller;

use App\Entity\Attempt;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Repository\CyclePuzzleRepository;
use App\Repository\CycleRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class TrainingSummaryAction
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

    public function __invoke(int $id): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        $training = $this->trainingRepository->findOneOwnedByUser($id, $user);

        if (!$training instanceof Training) {
            throw new NotFoundHttpException();
        }

        $trainingPuzzles = $this->trainingPuzzleRepository->findByTrainingWithPuzzleOrdered($training);
        $cycles = $this->cycleRepository->findByTrainingOrdered($training);
        $cyclePuzzles = $this->cyclePuzzleRepository->findByTrainingOrdered($training);
        $attempts = $this->attemptRepository->findByTrainingOrdered($training);

        $cyclePuzzlesByCycle = [];
        foreach ($cyclePuzzles as $cyclePuzzle) {
            $cycleId = $cyclePuzzle->getCycle()?->getId();
            if (null === $cycleId) {
                continue;
            }

            $cyclePuzzlesByCycle[$cycleId][] = $cyclePuzzle;
        }

        $attemptsByCyclePuzzle = [];
        $dailyActivity = [];
        foreach ($attempts as $attempt) {
            $cyclePuzzleId = $attempt->getCyclePuzzle()?->getId();
            if (null !== $cyclePuzzleId) {
                $attemptsByCyclePuzzle[$cyclePuzzleId][] = $attempt;
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
        ksort($dailyActivity);

        $cycleSummaries = $this->withProgressDeltas(array_map(
            fn (Cycle $cycle): array => $this->buildCycleSummary(
                $cycle,
                $cyclePuzzlesByCycle[$cycle->getId() ?? 0] ?? [],
                $attemptsByCyclePuzzle,
            ),
            array_reverse($cycles),
        ));

        $completedAttempts = array_values(array_filter(
            $attempts,
            fn (Attempt $attempt): bool => 'in_progress' !== $attempt->getStatus(),
        ));
        $solvedAttempts = array_values(array_filter(
            $completedAttempts,
            fn (Attempt $attempt): bool => 'solved' === $attempt->getStatus(),
        ));

        $payload = [
            'puzzleCount' => count($trainingPuzzles),
            'ratedPuzzleCount' => count(array_filter(
                $trainingPuzzles,
                fn (TrainingPuzzle $trainingPuzzle): bool => null !== $trainingPuzzle->getPuzzle()?->getRating(),
            )),
            'themedPuzzleCount' => count(array_filter(
                $trainingPuzzles,
                fn (TrainingPuzzle $trainingPuzzle): bool => count($trainingPuzzle->getPuzzle()?->getThemes() ?? []) > 0,
            )),
            'notedPuzzleCount' => count(array_filter(
                $trainingPuzzles,
                fn (TrainingPuzzle $trainingPuzzle): bool => '' !== trim($trainingPuzzle->getPersonalNote() ?? ''),
            )),
            'attemptCount' => count($attempts),
            'solvedAttemptCount' => count($solvedAttempts),
            'averageMistakes' => count($completedAttempts) > 0
                ? round(array_sum(array_map(
                    fn (Attempt $attempt): int => $attempt->getMistakesCount(),
                    $completedAttempts,
                )) / count($completedAttempts), 1)
                : 0,
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
            'latestCycleSummary' => $cycleSummaries[0] ?? null,
            'cycleSummaries' => $cycleSummaries,
            'latestAttempts' => array_map(
                $this->normalizeAttemptSummary(...),
                array_slice($attempts, 0, 8),
            ),
        ];

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }

    /**
     * @param list<CyclePuzzle> $cyclePuzzles
     * @param array<int, list<Attempt>> $attemptsByCyclePuzzle
     *
     * @return array<string, mixed>
     */
    private function buildCycleSummary(Cycle $cycle, array $cyclePuzzles, array $attemptsByCyclePuzzle): array
    {
        $solved = 0;
        $failed = 0;
        $pending = 0;
        $completedPuzzleCount = 0;
        $completedAttemptCount = 0;
        $puzzlesWithCompletedAttemptsCount = 0;
        $durationMilliseconds = 0;

        foreach ($cyclePuzzles as $cyclePuzzle) {
            $cyclePuzzleId = $cyclePuzzle->getId() ?? 0;
            $cycleAttempts = $attemptsByCyclePuzzle[$cyclePuzzleId] ?? [];
            $completedAttemptsForPuzzle = array_values(array_filter(
                $cycleAttempts,
                fn (Attempt $attempt): bool => 'in_progress' !== $attempt->getStatus(),
            ));
            $hasSolvedAttempt = count(array_filter(
                $cycleAttempts,
                fn (Attempt $attempt): bool => 'solved' === $attempt->getStatus(),
            )) > 0;

            if ('solved' === $cyclePuzzle->getStatus()) {
                $solved += 1;
            } elseif ('failed' === $cyclePuzzle->getStatus()) {
                $failed += 1;
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

            $durationMilliseconds += $cyclePuzzle->getDurationMilliseconds();
        }

        $total = count($cyclePuzzles);

        return [
            'cycle' => $this->normalizeCycle($cycle),
            'solved' => $solved,
            'failed' => $failed,
            'pending' => $pending,
            'total' => $total,
            'progressPercent' => $total > 0 ? (int) round((($solved + $failed) / $total) * 100) : 0,
            'progressDelta' => null,
            'completedPuzzleCount' => $completedPuzzleCount,
            'attemptCount' => $completedAttemptCount,
            'averageAttempts' => $puzzlesWithCompletedAttemptsCount > 0 ? round($completedAttemptCount / $puzzlesWithCompletedAttemptsCount, 1) : 0,
            'puzzlesWithCompletedAttemptsCount' => $puzzlesWithCompletedAttemptsCount,
            'durationMilliseconds' => $durationMilliseconds,
            'successRate' => ($solved + $failed) > 0 ? (int) round(($solved / ($solved + $failed)) * 100) : 0,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeAttemptSummary(Attempt $attempt): array
    {
        $cyclePuzzle = $attempt->getCyclePuzzle();
        $trainingPuzzle = $cyclePuzzle?->getTrainingPuzzle();

        return [
            '@id' => $this->iri('attempts', $attempt->getId()),
            'id' => $attempt->getId(),
            'successful' => 'solved' === $attempt->getStatus(),
            'mistakesCount' => $attempt->getMistakesCount(),
            'durationMilliseconds' => $attempt->getDurationMilliseconds(),
            'attemptedAt' => $this->formatDateTime($attempt->getAttemptedAt()),
            'cycleNumber' => $cyclePuzzle?->getCycle()?->getNumber(),
            'trainingPuzzlePosition' => $trainingPuzzle?->getPosition(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeCycle(Cycle $cycle): array
    {
        return [
            '@id' => $this->iri('cycles', $cycle->getId()),
            'id' => $cycle->getId(),
            'training' => $this->iri('trainings', $cycle->getTraining()?->getId()),
            'number' => $cycle->getNumber(),
            'status' => $cycle->getStatus(),
            'startedAt' => $this->formatDateTime($cycle->getStartedAt()),
            'completedAt' => $this->formatDateTime($cycle->getCompletedAt()),
        ];
    }

    /**
     * @param list<array<string, mixed>> $cycleSummaries
     *
     * @return list<array<string, mixed>>
     */
    private function withProgressDeltas(array $cycleSummaries): array
    {
        foreach ($cycleSummaries as $index => $cycleSummary) {
            $previousCycle = $cycleSummaries[$index + 1] ?? null;
            $cycleSummaries[$index]['progressDelta'] = is_array($previousCycle)
                ? (int) (($cycleSummary['successRate'] ?? 0) - ($previousCycle['successRate'] ?? 0))
                : null;
        }

        return $cycleSummaries;
    }

    private function iri(string $resource, ?int $id): ?string
    {
        return null === $id ? null : sprintf('/api/%s/%d', $resource, $id);
    }

    private function formatDateTime(?\DateTimeImmutable $dateTime): ?string
    {
        return $dateTime?->format(DATE_ATOM);
    }
}
