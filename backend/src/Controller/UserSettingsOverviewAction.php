<?php

namespace App\Controller;

use App\Entity\Training;
use App\Entity\User;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class UserSettingsOverviewAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingRepository $trainingRepository,
        private readonly TrainingPuzzleRepository $trainingPuzzleRepository,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        $trainings = $this->trainingRepository->findOwnedByUserOrdered($user);
        $trainingCount = count($trainings);
        $activeTrainingCount = count(array_filter(
            $trainings,
            fn (Training $training): bool => 'active' === $training->getStatus(),
        ));
        $archivedTrainingCount = count(array_filter(
            $trainings,
            fn (Training $training): bool => 'archived' === $training->getStatus(),
        ));

        $puzzleCount = 0;
        $mistakeLimitTotal = 0;
        foreach ($trainings as $training) {
            $puzzleCount += count($this->trainingPuzzleRepository->findByTrainingWithPuzzleOrdered($training));
            $mistakeLimitTotal += $training->getMistakeLimit();
        }

        $payload = [
            'user' => [
                '@id' => $this->iri('users', $user->getId()),
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'createdAt' => $user->getCreatedAt()?->format(DATE_ATOM),
            ],
            'workspace' => [
                'trainingCount' => $trainingCount,
                'activeTrainingCount' => $activeTrainingCount,
                'archivedTrainingCount' => $archivedTrainingCount,
                'puzzleCount' => $puzzleCount,
                'latestTrainingName' => ($trainings[0] ?? null)?->getName(),
            ],
            'preferencesPreview' => [
                'defaultMistakeLimit' => $trainingCount > 0 ? (int) round($mistakeLimitTotal / $trainingCount) : 3,
                'lockTrainingAfterCycle' => true,
                'trackedSolverByDefault' => true,
            ],
            'integrations' => [
                'lichessConnected' => false,
                'chessComConnected' => false,
                'exportReady' => $trainingCount > 0,
            ],
        ];

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }

    private function iri(string $resource, ?int $id): ?string
    {
        return null === $id ? null : sprintf('/api/%s/%d', $resource, $id);
    }
}
