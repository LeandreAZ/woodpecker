<?php

namespace App\Controller;

use App\Entity\Attempt;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class TrainingAttemptHistoryAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingRepository $trainingRepository,
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

        $attempts = $this->attemptRepository->findByTrainingOrdered($training);
        $successfulAttemptCount = count(array_filter(
            $attempts,
            fn (Attempt $attempt): bool => $attempt->isSuccessful(),
        ));

        $payload = [
            'training' => $this->normalizeTraining($training),
            'attemptCount' => count($attempts),
            'successfulAttemptCount' => $successfulAttemptCount,
            'failedAttemptCount' => count($attempts) - $successfulAttemptCount,
            'latestAttemptedAt' => $attempts[0]?->getAttemptedAt()?->format(DATE_ATOM),
            'attempts' => array_map($this->normalizeAttempt(...), $attempts),
        ];

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
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
    private function normalizeAttempt(Attempt $attempt): array
    {
        $cyclePuzzle = $attempt->getCyclePuzzle();
        $cycle = $cyclePuzzle?->getCycle();
        $trainingPuzzle = $cyclePuzzle?->getTrainingPuzzle();
        $puzzle = $trainingPuzzle?->getPuzzle();

        return [
            '@id' => $this->iri('attempts', $attempt->getId()),
            'id' => $attempt->getId(),
            'successful' => $attempt->isSuccessful(),
            'mistakesCount' => $attempt->getMistakesCount(),
            'durationMilliseconds' => $attempt->getDurationMilliseconds(),
            'playedMoves' => $attempt->getPlayedMoves(),
            'attemptedAt' => $attempt->getAttemptedAt()?->format(DATE_ATOM),
            'cycle' => [
                '@id' => $this->iri('cycles', $cycle?->getId()),
                'id' => $cycle?->getId(),
                'number' => $cycle?->getNumber(),
                'status' => $cycle?->getStatus(),
            ],
            'cyclePuzzle' => [
                '@id' => $this->iri('cycle_puzzles', $cyclePuzzle?->getId()),
                'id' => $cyclePuzzle?->getId(),
                'position' => $cyclePuzzle?->getPosition(),
                'status' => $cyclePuzzle?->getStatus(),
            ],
            'trainingPuzzle' => [
                '@id' => $this->iri('training_puzzles', $trainingPuzzle?->getId()),
                'id' => $trainingPuzzle?->getId(),
                'position' => $trainingPuzzle?->getPosition(),
                'personalNote' => $trainingPuzzle?->getPersonalNote(),
            ],
            'puzzle' => $this->normalizePuzzle($puzzle),
        ];
    }

    /**
     * @return array<string, mixed>|null
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

    private function iri(string $resource, ?int $id): ?string
    {
        return null === $id ? null : sprintf('/api/%s/%d', $resource, $id);
    }
}
