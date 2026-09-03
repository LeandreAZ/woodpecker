<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\AuthenticationEventRepository;
use App\Repository\TrainingRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class UserDeleteAction
{
    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly TrainingRepository $trainingRepository,
        private readonly AuthenticationEventRepository $authenticationEventRepository,
    ) {
    }

    #[Route('/api/users/me', name: 'api_user_delete', methods: ['DELETE'])]
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

        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $currentPassword = (string) ($payload['currentPassword'] ?? '');

        if ($email !== $user->getEmail()) {
            throw new BadRequestHttpException('L\'adresse e-mail de confirmation ne correspond pas au compte courant.');
        }

        if ('' === $currentPassword || !$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
            throw new BadRequestHttpException('Le mot de passe actuel est invalide.');
        }

        foreach ($this->authenticationEventRepository->findBy(['user' => $user]) as $event) {
            $this->entityManager->remove($event);
        }

        foreach ($this->trainingRepository->findOwnedByUserOrdered($user) as $training) {
            $this->entityManager->remove($training);
        }

        if (null !== $user->getPreference()) {
            $this->entityManager->remove($user->getPreference());
        }

        $this->entityManager->remove($user);
        $this->entityManager->flush();

        return new JsonResponse(null, 204);
    }
}
