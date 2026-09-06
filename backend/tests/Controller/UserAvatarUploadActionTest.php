<?php

namespace App\Tests\Controller;

use App\Controller\UserAvatarUploadAction;
use App\Controller\UserSettingsOverviewAction;
use App\Entity\User;
use App\Entity\UserPreference;
use App\Repository\AuthenticationEventRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use App\Service\UserPreferenceManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class UserAvatarUploadActionTest extends TestCase
{
    private Security&MockObject $security;
    private EntityManagerInterface&MockObject $entityManager;
    private UserSettingsOverviewAction $overviewAction;
    private string $projectDir;
    private UserAvatarUploadAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $trainingRepository = $this->createMock(TrainingRepository::class);
        $trainingRepository->method('findOwnedByUserOrdered')->willReturn([]);
        $trainingPuzzleRepository = $this->createMock(TrainingPuzzleRepository::class);
        $authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);
        $authenticationEventRepository->method('findLatestByUserAndType')->willReturn(null);
        $userPreferenceManager = new UserPreferenceManager($this->entityManager);
        $this->overviewAction = new UserSettingsOverviewAction(
            $this->security,
            $trainingRepository,
            $trainingPuzzleRepository,
            $userPreferenceManager,
            $authenticationEventRepository,
        );
        $this->projectDir = sys_get_temp_dir().'/woodpecker-avatar-tests';
        @mkdir($this->projectDir.'/public/uploads/avatars', 0775, true);

        $this->action = new UserAvatarUploadAction(
            $this->security,
            $this->entityManager,
            $this->overviewAction,
            $this->projectDir,
        );
    }

    protected function tearDown(): void
    {
        $directory = $this->projectDir.'/public/uploads/avatars';
        if (is_dir($directory)) {
            foreach (glob($directory.'/*') ?: [] as $file) {
                @unlink($file);
            }
        }
    }

    public function testThrowsNotFoundWhenUserIsMissing(): void
    {
        $this->security->method('getUser')->willReturn(null);

        $this->expectException(NotFoundHttpException::class);

        ($this->action)(new Request());
    }


    public function testStoresAvatarUsingDetectedMimeType(): void
    {
        $user = (new User())->setEmail('owner@example.com');
        $this->setEntityId($user, 7);
        $filePath = tempnam(sys_get_temp_dir(), 'avatar');
        file_put_contents($filePath, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBZkAAAAASUVORK5CYII='));
        $uploadedFile = new UploadedFile($filePath, 'avatar.jpeg', 'image/jpeg', null, true);

        $request = new Request([], [], [], [], ['avatar' => $uploadedFile]);
        $preference = (new UserPreference())
            ->setUser($user)
            ->setDisplayName('owner@example.com');
        $user->setPreference($preference);

        $this->security->method('getUser')->willReturn($user);
        $this->entityManager->expects($this->once())->method('persist')->with($user);
        $this->entityManager->expects($this->once())->method('flush');

        try {
            ($this->action)($request);
            self::assertNotNull($user->getAvatarUrl());
            self::assertStringStartsWith('/uploads/avatars/user-7-', $user->getAvatarUrl());
            self::assertStringEndsWith('.png', $user->getAvatarUrl());
        } finally {
            @unlink($filePath);
        }
    }

    public function testRejectsTextDisguisedAsJpeg(): void
    {
        $user = (new User())->setEmail('owner@example.com');
        $this->setEntityId($user, 1);
        $filePath = tempnam(sys_get_temp_dir(), 'avatar');
        file_put_contents($filePath, 'not-an-image');
        $uploadedFile = new UploadedFile($filePath, 'avatar.jpg', 'image/jpeg', null, true);

        $request = new Request([], [], [], [], ['avatar' => $uploadedFile]);
        $this->security->method('getUser')->willReturn($user);

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage('Le format de la photo doit être JPEG, PNG ou WebP.');

        try {
            ($this->action)($request);
        } finally {
            @unlink($filePath);
        }
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}
