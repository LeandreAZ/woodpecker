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
        $successfulAttemptCount = 0;

        foreach ($trainings as $training) {
            $attempts = $this->attemptRepository->findByTrainingOrdered($training);

            foreach ($attempts as $attempt) {
                $totalMistakes += $attempt->getMistakesCount();
                if ($attempt->isSuccessful()) {
                    $successfulAttemptCount += 1;
                }

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
        $latestCyclePuzzles = $latestCycle instanceof Cycle
            ? array_values(array_filter(
                $cyclePuzzles,
                fn (CyclePuzzle $cyclePuzzle): bool => $cyclePuzzle->getCycle()?->getId() === $latestCycle->getId(),
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
        $latestAttempt = count($attempts) > 0 ? $attempts[0] : null;

        return [
            'training' => [
                '@id' => sprintf('/api/trainings/%d', $training->getId()),
                'id' => $training->getId(),
                'name' => $training->getName(),
                'description' => $training->getDescription(),
                'status' => $training->getStatus(),
                'mistakeLimit' => $training->getMistakeLimit(),
                'createdAt' => $training->getCreatedAt()?->format(DATE_ATOM),
            ],
            'puzzleCount' => count($trainingPuzzles),
            'attemptCount' => count($attempts),
            'progressPercent' => $progressPercent,
            'solvedCount' => $solved,
            'failedCount' => $failed,
            'pendingCount' => $pending,
            'latestCycleNumber' => $latestCycle?->getNumber(),
            'latestCycleStatus' => $latestCycle?->getStatus(),
            'hasResumableCycle' => $latestCycle?->getStatus() === 'active' && $pending > 0,
            'latestAttemptedAt' => $latestAttempt instanceof Attempt ? $latestAttempt->getAttemptedAt()?->format(DATE_ATOM) : null,
            'descriptionReady' => '' !== trim($training->getDescription() ?? ''),
        ];
    }
}
