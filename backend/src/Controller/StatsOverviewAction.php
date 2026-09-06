<?php

namespace App\Controller;

use App\Entity\User;
use App\ReadModel\StatsOverviewReader;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class StatsOverviewAction
{
    public function __construct(
        private readonly Security $security,
        private readonly StatsOverviewReader $reader,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        $payload = $this->reader->build($user);

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }
}
