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
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class HistoryOverviewAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingRepository $trainingRepository,
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
        $recentAttempts = [];
        $recentCycles = [];
        $successfulAttemptCount = 0;
        $latestAttemptedAt = null;
        $activeCycleCount = 0;
        $completedCycleCount = 0;
        $cycleCount = 0;

        foreach ($trainings as $training) {
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
                if ($attempt->isSuccessful()) {
                    $successfulAttemptCount += 1;
                }

                $attemptedAt = $attempt->getAttemptedAt();
                if ($attemptedAt instanceof \DateTimeImmutable && (null === $latestAttemptedAt || $attemptedAt > $latestAttemptedAt)) {
                    $latestAttemptedAt = $attemptedAt;
                }

                $cyclePuzzleId = $attempt->getCyclePuzzle()?->getId();
                if (null !== $cyclePuzzleId) {
                    $attemptsByCyclePuzzle[$cyclePuzzleId][] = $attempt;
                }

                $recentAttempts[] = $this->normalizeAttemptSummary($training, $attempt);
            }

            foreach ($cycles as $cycle) {
                $cycleCount += 1;

                if ('active' === $cycle->getStatus()) {
                    $activeCycleCount += 1;
                }

                if ('completed' === $cycle->getStatus()) {
                    $completedCycleCount += 1;
                }

                $recentCycles[] = $this->buildCycleSummary(
                    $training,
                    $cycle,
                    $cyclePuzzlesByCycle[$cycle->getId() ?? 0] ?? [],
                    $attemptsByCyclePuzzle,
                );
            }
        }

        usort(
            $recentAttempts,
            fn (array $left, array $right): int => strcmp($right['attemptedAt'] ?? '', $left['attemptedAt'] ?? ''),
        );
        usort(
            $recentCycles,
            fn (array $left, array $right): int => strcmp($this->cycleSortValue($right), $this->cycleSortValue($left)),
        );

        $attemptCount = count($recentAttempts);

        $payload = [
            'attemptCount' => $attemptCount,
            'successfulAttemptCount' => $successfulAttemptCount,
            'failedAttemptCount' => $attemptCount - $successfulAttemptCount,
            'cycleCount' => $cycleCount,
            'activeCycleCount' => $activeCycleCount,
            'completedCycleCount' => $completedCycleCount,
            'latestAttemptedAt' => $latestAttemptedAt?->format(DATE_ATOM),
            'recentAttempts' => array_slice($recentAttempts, 0, 12),
            'recentCycles' => array_slice($recentCycles, 0, 12),
        ];

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }

    /**
     * @param list<CyclePuzzle> $cyclePuzzles
     * @param array<int, list<Attempt>> $attemptsByCyclePuzzle
     *
     * @return array<string, mixed>
     */
    private function buildCycleSummary(Training $training, Cycle $cycle, array $cyclePuzzles, array $attemptsByCyclePuzzle): array
    {
        $solved = count(array_filter(
            $cyclePuzzles,
            fn (CyclePuzzle $cyclePuzzle): bool => 'solved' === $cyclePuzzle->getStatus(),
        ));
        $failed = count(array_filter(
            $cyclePuzzles,
            fn (CyclePuzzle $cyclePuzzle): bool => 'failed' === $cyclePuzzle->getStatus(),
        ));
        $pending = count(array_filter(
            $cyclePuzzles,
            fn (CyclePuzzle $cyclePuzzle): bool => 'pending' === $cyclePuzzle->getStatus(),
        ));
        $attemptCount = 0;

        foreach ($cyclePuzzles as $cyclePuzzle) {
            $attemptCount += count($attemptsByCyclePuzzle[$cyclePuzzle->getId() ?? 0] ?? []);
        }

        $total = count($cyclePuzzles);

        return [
            'training' => $this->normalizeTraining($training),
            'cycle' => $this->normalizeCycle($cycle),
            'solved' => $solved,
            'failed' => $failed,
            'pending' => $pending,
            'total' => $total,
            'progressPercent' => $total > 0 ? (int) round(($solved / $total) * 100) : 0,
            'attemptCount' => $attemptCount,
            'hasResumableCycle' => 'active' === $cycle->getStatus() && $pending > 0,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeAttemptSummary(Training $training, Attempt $attempt): array
    {
        $cyclePuzzle = $attempt->getCyclePuzzle();
        $trainingPuzzle = $cyclePuzzle?->getTrainingPuzzle();

        return [
            '@id' => $this->iri('attempts', $attempt->getId()),
            'id' => $attempt->getId(),
            'training' => $this->normalizeTraining($training),
            'successful' => $attempt->isSuccessful(),
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
     * @param array<string, mixed> $cycleSummary
     */
    private function cycleSortValue(array $cycleSummary): string
    {
        $cycle = $cycleSummary['cycle'] ?? [];

        return (string) ($cycle['completedAt'] ?? $cycle['startedAt'] ?? '');
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
