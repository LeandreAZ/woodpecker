<?php

namespace App\ReadModel;

use App\Entity\Attempt;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\TrainingSession;
use App\Repository\CyclePuzzleRepository;
use App\Repository\CycleRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingSessionRepository;

final class TrainingOverviewReader
{
    public function __construct(
        private readonly TrainingPuzzleRepository $trainingPuzzleRepository,
        private readonly CycleRepository $cycleRepository,
        private readonly CyclePuzzleRepository $cyclePuzzleRepository,
        private readonly TrainingSessionRepository $trainingSessionRepository,
    ) {
    }

    /** @return array<string, mixed> */
    public function build(Training $training): array
    {
        $payload = [
            'trainingPuzzles' => array_map($this->normalizeTrainingPuzzle(...), $this->trainingPuzzleRepository->findByTrainingWithPuzzleOrdered($training)),
            'cycles' => array_map($this->normalizeCycle(...), $this->cycleRepository->findByTrainingOrdered($training)),
            'cyclePuzzles' => array_map($this->normalizeCyclePuzzle(...), $this->cyclePuzzleRepository->findByTrainingOrdered($training)),
            'trainingSessions' => array_map($this->normalizeTrainingSession(...), $this->trainingSessionRepository->findByTrainingOrdered($training)),
        ];

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeTrainingPuzzle(TrainingPuzzle $trainingPuzzle): array
    {
        return [
            '@id' => $this->iri('training_puzzles', $trainingPuzzle->getId()),
            'id' => $trainingPuzzle->getId(),
            'training' => $this->iri('trainings', $trainingPuzzle->getTraining()?->getId()),
            'puzzle' => $this->normalizePuzzle($trainingPuzzle->getPuzzle()),
            'position' => $trainingPuzzle->getPosition(),
            'personalNote' => $trainingPuzzle->getPersonalNote(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizePuzzle(?Puzzle $puzzle): ?array
    {
        if (!$puzzle instanceof Puzzle) {
            return null;
        }

        return [
            '@id' => $this->iri('puzzles', $puzzle->getId()),
            'id' => $puzzle->getId(),
            'fen' => $puzzle->getFen(),
            'solution' => $puzzle->getSolution(),
            'themes' => $puzzle->getThemes(),
            'rating' => $puzzle->getRating(),
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
     * @return array<string, mixed>
     */
    private function normalizeCyclePuzzle(CyclePuzzle $cyclePuzzle): array
    {
        $attempts = $cyclePuzzle->getAttempts()->toArray();
        usort(
            $attempts,
            static fn (Attempt $left, Attempt $right) => [$left->getAttemptNumber(), $left->getId() ?? 0] <=> [$right->getAttemptNumber(), $right->getId() ?? 0],
        );

        $normalizedAttempts = array_map($this->normalizeAttempt(...), $attempts);
        $activeAttempt = null;
        $completedAttemptCount = 0;
        $completedDurationMilliseconds = 0;
        $hasSolvedAttempt = false;

        foreach ($attempts as $attempt) {
            if ('in_progress' === $attempt->getStatus()) {
                $activeAttempt = $this->normalizeAttempt($attempt);
                continue;
            }

            $completedAttemptCount += 1;
            $completedDurationMilliseconds += $attempt->getDurationMilliseconds();
            $hasSolvedAttempt = $hasSolvedAttempt || 'solved' === $attempt->getStatus();
        }

        return [
            '@id' => $this->iri('cycle_puzzles', $cyclePuzzle->getId()),
            'id' => $cyclePuzzle->getId(),
            'cycle' => $this->iri('cycles', $cyclePuzzle->getCycle()?->getId()),
            'trainingPuzzle' => $this->iri('training_puzzles', $cyclePuzzle->getTrainingPuzzle()?->getId()),
            'position' => $cyclePuzzle->getPosition(),
            'status' => $cyclePuzzle->getStatus(),
            'attemptCount' => $cyclePuzzle->getAttemptCount(),
            'durationMilliseconds' => $cyclePuzzle->getDurationMilliseconds(),
            'completedAt' => $this->formatDateTime($cyclePuzzle->getCompletedAt()),
            'attempts' => $normalizedAttempts,
            'activeAttempt' => $activeAttempt,
            'completedAttemptCount' => $completedAttemptCount,
            'completedDurationMilliseconds' => $completedDurationMilliseconds,
            'hasSolvedAttempt' => $hasSolvedAttempt,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeAttempt(Attempt $attempt): array
    {
        return [
            '@id' => $this->iri('attempts', $attempt->getId()),
            'id' => $attempt->getId(),
            'clientRequestId' => $attempt->getClientRequestId(),
            'cyclePuzzle' => $this->iri('cycle_puzzles', $attempt->getCyclePuzzle()?->getId()),
            'trainingSession' => $this->iri('training_sessions', $attempt->getTrainingSession()?->getId()),
            'attemptNumber' => $attempt->getAttemptNumber(),
            'status' => $attempt->getStatus(),
            'playedMoves' => $attempt->getPlayedMoves(),
            'successful' => $attempt->isSuccessful(),
            'mistakesCount' => $attempt->getMistakesCount(),
            'durationMilliseconds' => $attempt->getDurationMilliseconds(),
            'startedAt' => $this->formatDateTime($attempt->getStartedAt()),
            'completedAt' => $this->formatDateTime($attempt->getCompletedAt()),
            'attemptedAt' => $this->formatDateTime($attempt->getAttemptedAt()),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeTrainingSession(TrainingSession $trainingSession): array
    {
        return [
            '@id' => $this->iri('training_sessions', $trainingSession->getId()),
            'id' => $trainingSession->getId(),
            'training' => $this->iri('trainings', $trainingSession->getTraining()?->getId()),
            'cycle' => $this->iri('cycles', $trainingSession->getCycle()?->getId()),
            'startedAt' => $this->formatDateTime($trainingSession->getStartedAt()),
        ];
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
