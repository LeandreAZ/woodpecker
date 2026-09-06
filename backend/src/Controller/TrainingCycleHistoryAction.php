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
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class TrainingCycleHistoryAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingRepository $trainingRepository,
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

        $cycleHistory = $this->withProgressDeltas(array_map(
            fn (Cycle $cycle): array => $this->normalizeCycleHistory(
                $cycle,
                $cyclePuzzlesByCycle[$cycle->getId() ?? 0] ?? [],
                $attemptsByCyclePuzzle,
            ),
            array_reverse($cycles),
        ));

        $payload = [
            'training' => $this->normalizeTraining($training),
            'cycleCount' => count($cycles),
            'activeCycleCount' => count(array_filter($cycles, fn (Cycle $cycle): bool => 'active' === $cycle->getStatus())),
            'completedCycleCount' => count(array_filter($cycles, fn (Cycle $cycle): bool => 'completed' === $cycle->getStatus())),
            'cycles' => $cycleHistory,
        ];

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }

    /**
     * @param list<CyclePuzzle> $cyclePuzzles
     * @param array<int, list<Attempt>> $attemptsByCyclePuzzle
     *
     * @return array<string, mixed>
     */
    private function normalizeCycleHistory(Cycle $cycle, array $cyclePuzzles, array $attemptsByCyclePuzzle): array
    {
        $solved = count(array_filter($cyclePuzzles, fn (CyclePuzzle $cyclePuzzle): bool => 'solved' === $cyclePuzzle->getStatus()));
        $failed = count(array_filter($cyclePuzzles, fn (CyclePuzzle $cyclePuzzle): bool => 'failed' === $cyclePuzzle->getStatus()));
        $pending = count(array_filter($cyclePuzzles, fn (CyclePuzzle $cyclePuzzle): bool => 'pending' === $cyclePuzzle->getStatus()));
        $attemptCount = 0;
        $latestAttemptedAt = null;

        foreach ($cyclePuzzles as $cyclePuzzle) {
            $cyclePuzzleAttempts = $attemptsByCyclePuzzle[$cyclePuzzle->getId() ?? 0] ?? [];
            $attemptCount += count($cyclePuzzleAttempts);

            foreach ($cyclePuzzleAttempts as $attempt) {
                $attemptedAt = $attempt->getAttemptedAt();
                if ($attemptedAt instanceof \DateTimeImmutable && (null === $latestAttemptedAt || $attemptedAt > $latestAttemptedAt)) {
                    $latestAttemptedAt = $attemptedAt;
                }
            }
        }

        $total = count($cyclePuzzles);
        $successRate = ($solved + $failed) > 0 ? (int) round(($solved / ($solved + $failed)) * 100) : 0;

        return [
            'cycle' => [
                '@id' => $this->iri('cycles', $cycle->getId()),
                'id' => $cycle->getId(),
                'number' => $cycle->getNumber(),
                'status' => $cycle->getStatus(),
                'startedAt' => $cycle->getStartedAt()?->format(DATE_ATOM),
                'completedAt' => $cycle->getCompletedAt()?->format(DATE_ATOM),
                'targetDurationSeconds' => $cycle->getTargetDurationSeconds(),
            ],
            'solved' => $solved,
            'failed' => $failed,
            'pending' => $pending,
            'total' => $total,
            'progressPercent' => $total > 0 ? (int) round((($solved + $failed) / $total) * 100) : 0,
            'progressDelta' => null,
            'successRate' => $successRate,
            'attemptCount' => $attemptCount,
            'latestAttemptedAt' => $latestAttemptedAt?->format(DATE_ATOM),
            'hasResumableCycle' => 'active' === $cycle->getStatus() && $pending > 0,
            'cyclePuzzles' => array_map($this->normalizeCyclePuzzle(...), $cyclePuzzles),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeCyclePuzzle(CyclePuzzle $cyclePuzzle): array
    {
        $trainingPuzzle = $cyclePuzzle->getTrainingPuzzle();

        return [
            '@id' => $this->iri('cycle_puzzles', $cyclePuzzle->getId()),
            'id' => $cyclePuzzle->getId(),
            'position' => $cyclePuzzle->getPosition(),
            'status' => $cyclePuzzle->getStatus(),
            'attemptCount' => $cyclePuzzle->getAttemptCount(),
            'durationMilliseconds' => $cyclePuzzle->getDurationMilliseconds(),
            'completedAt' => $cyclePuzzle->getCompletedAt()?->format(DATE_ATOM),
            'trainingPuzzle' => $this->normalizeTrainingPuzzle($trainingPuzzle),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function normalizeTrainingPuzzle(?TrainingPuzzle $trainingPuzzle): ?array
    {
        if (!$trainingPuzzle instanceof TrainingPuzzle) {
            return null;
        }

        return [
            '@id' => $this->iri('training_puzzles', $trainingPuzzle->getId()),
            'id' => $trainingPuzzle->getId(),
            'position' => $trainingPuzzle->getPosition(),
            'personalNote' => $trainingPuzzle->getPersonalNote(),
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
     * @param list<array<string, mixed>> $cycles
     *
     * @return list<array<string, mixed>>
     */
    private function withProgressDeltas(array $cycles): array
    {
        foreach ($cycles as $index => $cycle) {
            $hasActivity = (($cycle['solved'] ?? 0) + ($cycle['failed'] ?? 0)) > 0;
            $previousCycle = null;
            for ($previousIndex = $index + 1, $count = count($cycles); $previousIndex < $count; $previousIndex++) {
                $candidate = $cycles[$previousIndex];
                if ((($candidate['solved'] ?? 0) + ($candidate['failed'] ?? 0)) > 0) {
                    $previousCycle = $candidate;
                    break;
                }
            }
            $cycles[$index]['progressDelta'] = $hasActivity && is_array($previousCycle)
                ? (int) (($cycle['successRate'] ?? 0) - ($previousCycle['successRate'] ?? 0))
                : null;
        }

        return $cycles;
    }

    private function iri(string $resource, ?int $id): ?string
    {
        return null === $id ? null : sprintf('/api/%s/%d', $resource, $id);
    }
}
