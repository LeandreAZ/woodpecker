<?php

namespace App\Controller;

use App\Entity\User;
use App\Enum\AuthenticationEventType;
use App\Service\AuthenticationEventRecorder;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Attribute\Route;

class AuthLogoutAction extends AbstractController
{
    public function __construct(
        private readonly AuthenticationEventRecorder $authenticationEventRecorder,
    ) {
    }

    #[Route('/api/auth/logout', name: 'api_auth_logout', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            throw new AccessDeniedHttpException();
        }

        $this->authenticationEventRecorder->record($user, AuthenticationEventType::Logout, $request, 'manual');

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
