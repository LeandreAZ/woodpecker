<?php

namespace App\Controller;

use App\Entity\User;
use App\ReadModel\TrainingOverviewReader;
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class TrainingOverviewAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingOverviewReader $reader,
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

        if (null === $training) {
            throw new NotFoundHttpException();
        }

        return new JsonResponse($this->reader->build($training), headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }
}
