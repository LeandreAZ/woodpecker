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

final class TrainingAnalyticsAction
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
        foreach ($attempts as $attempt) {
            $cyclePuzzleId = $attempt->getCyclePuzzle()?->getId();
            if (null === $cyclePuzzleId) {
                continue;
            }

            $attemptsByCyclePuzzle[$cyclePuzzleId][] = $attempt;
        }

        $cycleTimeline = array_map(
            fn (Cycle $cycle): array => $this->buildCycleAnalytics(
                $cycle,
                $cyclePuzzlesByCycle[$cycle->getId() ?? 0] ?? [],
                $attemptsByCyclePuzzle,
            ),
            array_reverse($cycles),
        );

        $solvedAttemptCount = count(array_filter(
            $attempts,
            fn (Attempt $attempt): bool => $attempt->isSuccessful(),
        ));
        $failedAttemptCount = count($attempts) - $solvedAttemptCount;
        $latestAttempt = $attempts[0] ?? null;
        $averageDurationSeconds = count($attempts) > 0
            ? (int) round(array_sum(array_map(
                fn (Attempt $attempt): int => $attempt->getDurationMilliseconds(),
                $attempts,
            )) / count($attempts) / 1000)
            : 0;
        $averageMistakes = count($attempts) > 0
            ? round(array_sum(array_map(
                fn (Attempt $attempt): int => $attempt->getMistakesCount(),
                $attempts,
            )) / count($attempts), 1)
            : 0;
        $latestCycleAnalytics = $cycleTimeline[0] ?? null;
        $bestCycleProgressPercent = count($cycleTimeline) > 0
            ? max(array_map(
                fn (array $item): int => $item['progressPercent'],
                $cycleTimeline,
            ))
            : 0;

        $payload = [
            'training' => $this->normalizeTraining($training),
            'performance' => [
                'attemptCount' => count($attempts),
                'solvedAttemptCount' => $solvedAttemptCount,
                'failedAttemptCount' => $failedAttemptCount,
                'successRate' => count($attempts) > 0 ? (int) round(($solvedAttemptCount / count($attempts)) * 100) : 0,
                'averageMistakes' => $averageMistakes,
                'averageDurationSeconds' => $averageDurationSeconds,
                'latestAttemptedAt' => $latestAttempt?->getAttemptedAt()?->format(DATE_ATOM),
            ],
            'puzzleReadiness' => [
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
            ],
            'progressionSnapshot' => [
                'activeCycleCount' => count(array_filter($cycles, fn (Cycle $cycle): bool => 'active' === $cycle->getStatus())),
                'completedCycleCount' => count(array_filter($cycles, fn (Cycle $cycle): bool => 'completed' === $cycle->getStatus())),
                'resumableCycle' => null !== $latestCycleAnalytics && 'active' === ($latestCycleAnalytics['cycle']['status'] ?? null) && ($latestCycleAnalytics['pending'] ?? 0) > 0,
                'latestCycleProgressPercent' => $latestCycleAnalytics['progressPercent'] ?? 0,
                'bestCycleProgressPercent' => $bestCycleProgressPercent,
            ],
            'cycleTimeline' => $cycleTimeline,
        ];

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }

    /**
     * @param list<CyclePuzzle> $cyclePuzzles
     * @param array<int, list<Attempt>> $attemptsByCyclePuzzle
     *
     * @return array<string, mixed>
     */
    private function buildCycleAnalytics(Cycle $cycle, array $cyclePuzzles, array $attemptsByCyclePuzzle): array
    {
        $solved = count(array_filter($cyclePuzzles, fn (CyclePuzzle $cyclePuzzle): bool => 'solved' === $cyclePuzzle->getStatus()));
        $failed = count(array_filter($cyclePuzzles, fn (CyclePuzzle $cyclePuzzle): bool => 'failed' === $cyclePuzzle->getStatus()));
        $pending = count(array_filter($cyclePuzzles, fn (CyclePuzzle $cyclePuzzle): bool => 'pending' === $cyclePuzzle->getStatus()));
        $attemptCount = 0;

        foreach ($cyclePuzzles as $cyclePuzzle) {
            $attemptCount += count($attemptsByCyclePuzzle[$cyclePuzzle->getId() ?? 0] ?? []);
        }

        $total = count($cyclePuzzles);

        return [
            'cycle' => $this->normalizeCycle($cycle),
            'solved' => $solved,
            'failed' => $failed,
            'pending' => $pending,
            'total' => $total,
            'progressPercent' => $total > 0 ? (int) round(($solved / $total) * 100) : 0,
            'attemptCount' => $attemptCount,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeTraining(Training $training): array
    {
        return [
            '@id' => $this->iri('trainings', $training->getId()),
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
            'startedAt' => $cycle->getStartedAt()?->format(DATE_ATOM),
            'completedAt' => $cycle->getCompletedAt()?->format(DATE_ATOM),
        ];
    }

    private function iri(string $resource, ?int $id): ?string
    {
        return null === $id ? null : sprintf('/api/%s/%d', $resource, $id);
    }
}
