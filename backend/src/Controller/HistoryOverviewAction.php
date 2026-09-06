<?php

namespace App\Controller;

use App\Entity\User;
use App\ReadModel\HistoryOverviewReader;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class HistoryOverviewAction
{
    public function __construct(
        private readonly Security $security,
        private readonly HistoryOverviewReader $reader,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        return new JsonResponse($this->reader->build($user), headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }
}
