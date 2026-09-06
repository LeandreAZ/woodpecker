<?php

namespace App\Controller;

use App\Entity\Training;
use App\Entity\User;
use App\ReadModel\TrainingAttemptHistoryReader;
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class TrainingAttemptHistoryAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingAttemptHistoryReader $reader,
        private readonly TrainingRepository $trainingRepository,
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

        return new JsonResponse($this->reader->build($training), headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }
}
