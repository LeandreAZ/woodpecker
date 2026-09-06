<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

final class UserAvatarUploadAction
{
    private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    private const MAX_FILE_SIZE_BYTES = 2097152;

    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserSettingsOverviewAction $userSettingsOverviewAction,
        #[Autowire('%kernel.project_dir%')] private readonly string $projectDir,
    ) {
    }

    #[Route('/api/users/me/avatar', name: 'api_user_avatar_upload', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        $avatar = $request->files->get('avatar');
        if (!$avatar instanceof UploadedFile) {
            throw new BadRequestHttpException("Aucun fichier avatar valide n'a été reçu.");
        }

        if ($avatar->getSize() > self::MAX_FILE_SIZE_BYTES) {
            throw new BadRequestHttpException('La photo de profil ne doit pas dépasser 2 Mo.');
        }

        $mimeType = $avatar->getClientMimeType();
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw new BadRequestHttpException('Le format de la photo doit être JPEG, PNG ou WebP.');
        }

        $uploadDirectory = $this->projectDir.'/public/uploads/avatars';
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
            throw new BadRequestHttpException("Le dossier de destination de l'avatar est indisponible.");
        }

        if (!is_writable($uploadDirectory)) {
            @chmod($uploadDirectory, 0775);
        }
        if (!is_writable($uploadDirectory)) {
            throw new BadRequestHttpException("Le dossier de destination de l'avatar est indisponible.");
        }

        $extension = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'bin',
        };
        $fileName = sprintf('user-%d-%s.%s', $user->getId(), bin2hex(random_bytes(6)), $extension);

        try {
            $avatar->move($uploadDirectory, $fileName);
        } catch (FileException $exception) {
            throw new BadRequestHttpException("Impossible d'enregistrer la photo de profil.", $exception);
        }

        $this->deletePreviousAvatar($user, $uploadDirectory);
        $user->setAvatarUrl('/uploads/avatars/'.$fileName);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return ($this->userSettingsOverviewAction)();
    }

    private function deletePreviousAvatar(User $user, string $uploadDirectory): void
    {
        $avatarUrl = $user->getAvatarUrl();
        if (null === $avatarUrl || !str_starts_with($avatarUrl, '/uploads/avatars/')) {
            return;
        }

        $existingPath = $uploadDirectory.'/'.basename($avatarUrl);
        if (is_file($existingPath)) {
            @unlink($existingPath);
        }
    }
}
