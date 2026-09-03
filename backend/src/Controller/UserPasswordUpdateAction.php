<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class UserPasswordUpdateAction
{
    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    #[Route('/api/users/me/password', name: 'api_user_password_update', methods: ['PUT'])]
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

        $currentPassword = (string) ($payload['currentPassword'] ?? '');
        $nextPassword = (string) ($payload['newPassword'] ?? '');
        $passwordConfirmation = (string) ($payload['confirmPassword'] ?? '');

        if ('' === $currentPassword || !$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
            throw new BadRequestHttpException('Le mot de passe actuel est invalide.');
        }

        if (mb_strlen($nextPassword) < 8) {
            throw new BadRequestHttpException('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        }

        if ($nextPassword !== $passwordConfirmation) {
            throw new BadRequestHttpException('La confirmation du mot de passe ne correspond pas.');
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $nextPassword));
        $user->eraseCredentials();
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return new JsonResponse(['message' => 'Mot de passe mis à jour.']);
    }
}
