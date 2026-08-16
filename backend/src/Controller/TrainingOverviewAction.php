<?php

namespace App\Controller;

use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Puzzle;
use App\Entity\TrainingPuzzle;
use App\Entity\TrainingSession;
use App\Entity\User;
use App\Repository\CyclePuzzleRepository;
use App\Repository\CycleRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use App\Repository\TrainingSessionRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class TrainingOverviewAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingRepository $trainingRepository,
        private readonly TrainingPuzzleRepository $trainingPuzzleRepository,
        private readonly CycleRepository $cycleRepository,
        private readonly CyclePuzzleRepository $cyclePuzzleRepository,
        private readonly TrainingSessionRepository $trainingSessionRepository,
    ) {
    }

    public function __invoke(int $id): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        $training = $this->trainingRepository->findOneOwnedByUser($id, $user);

        if (null === $training) {
            throw new NotFoundHttpException();
        }

        $payload = [
            'trainingPuzzles' => array_map($this->normalizeTrainingPuzzle(...), $this->trainingPuzzleRepository->findByTrainingWithPuzzleOrdered($training)),
            'cycles' => array_map($this->normalizeCycle(...), $this->cycleRepository->findByTrainingOrdered($training)),
            'cyclePuzzles' => array_map($this->normalizeCyclePuzzle(...), $this->cyclePuzzleRepository->findByTrainingOrdered($training)),
            'trainingSessions' => array_map($this->normalizeTrainingSession(...), $this->trainingSessionRepository->findByTrainingOrdered($training)),
        ];

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
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
        return [
            '@id' => $this->iri('cycle_puzzles', $cyclePuzzle->getId()),
            'id' => $cyclePuzzle->getId(),
            'cycle' => $this->iri('cycles', $cyclePuzzle->getCycle()?->getId()),
            'trainingPuzzle' => $this->iri('training_puzzles', $cyclePuzzle->getTrainingPuzzle()?->getId()),
            'position' => $cyclePuzzle->getPosition(),
            'status' => $cyclePuzzle->getStatus(),
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
