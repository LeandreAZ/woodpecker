<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class UserEmailUpdateAction
{
    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly UserRepository $userRepository,
        private readonly UserSettingsOverviewAction $userSettingsOverviewAction,
    ) {
    }

    #[Route('/api/users/me/email', name: 'api_user_email_update', methods: ['PUT'])]
    public function __invoke(Request $request): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        $payload = json_decode($request->getContent() ?: '{}', true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Le payload JSON est invalide.');
        }

        $nextEmail = strtolower(trim((string) ($payload['email'] ?? '')));
        $currentPassword = (string) ($payload['currentPassword'] ?? '');

        if ('' === $nextEmail || !filter_var($nextEmail, FILTER_VALIDATE_EMAIL)) {
            throw new BadRequestHttpException('La nouvelle adresse e-mail est invalide.');
        }

        if ('' === $currentPassword || !$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
            throw new BadRequestHttpException('Le mot de passe actuel est invalide.');
        }

        $existingUser = $this->userRepository->findOneBy(['email' => $nextEmail]);
        if ($existingUser instanceof User && $existingUser->getId() !== $user->getId()) {
            throw new ConflictHttpException('Cette adresse e-mail est déjà utilisée.');
        }

        $user->setEmail($nextEmail)->ensureDefaultPseudonym();
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return ($this->userSettingsOverviewAction)();
    }
}
