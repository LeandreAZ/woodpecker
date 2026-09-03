<?php

namespace App\Tests\Controller;

use App\Controller\UserEmailUpdateAction;
use App\Controller\UserSettingsOverviewAction;
use App\Entity\User;
use App\Repository\AuthenticationEventRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use App\Repository\UserRepository;
use App\Service\UserPreferenceManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserEmailUpdateActionTest extends TestCase
{
    private Security&MockObject $security;
    private EntityManagerInterface&MockObject $entityManager;
    private UserPasswordHasherInterface&MockObject $passwordHasher;
    private UserRepository&MockObject $userRepository;
    private TrainingRepository&MockObject $trainingRepository;
    private TrainingPuzzleRepository&MockObject $trainingPuzzleRepository;
    private AuthenticationEventRepository&MockObject $authenticationEventRepository;
    private UserEmailUpdateAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->trainingPuzzleRepository = $this->createMock(TrainingPuzzleRepository::class);
        $this->authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);

        $overviewAction = new UserSettingsOverviewAction(
            $this->security,
            $this->trainingRepository,
            $this->trainingPuzzleRepository,
            new UserPreferenceManager($this->entityManager),
            $this->authenticationEventRepository,
        );

        $this->action = new UserEmailUpdateAction(
            $this->security,
            $this->entityManager,
            $this->passwordHasher,
            $this->userRepository,
            $overviewAction,
        );
    }

    public function testUpdatesEmailAndReturnsOverview(): void
    {
        $user = (new User())
            ->setEmail('owner@example.com')
            ->setPseudonym('Owner');
        $this->setEntityId($user, 7);

        $request = Request::create('/api/users/me/email', 'PUT', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'next@example.com',
            'currentPassword' => 'secret123',
        ], JSON_THROW_ON_ERROR));

        $this->security->method('getUser')->willReturn($user);
        $this->passwordHasher->method('isPasswordValid')->with($user, 'secret123')->willReturn(true);
        $this->userRepository->method('findOneBy')->with(['email' => 'next@example.com'])->willReturn(null);
        $this->trainingRepository->method('findOwnedByUserOrdered')->with($user)->willReturn([]);
        $this->authenticationEventRepository->method('findLatestByUserAndType')->willReturn(null);
        $this->entityManager->expects(self::atLeastOnce())->method('persist');
        $this->entityManager->expects(self::once())->method('flush');

        $response = $this->action->__invoke($request);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('next@example.com', $user->getEmail());
        self::assertSame('next@example.com', $payload['user']['email']);
        self::assertSame('Owner', $payload['profile']['pseudonym']);
    }

    public function testRejectsDuplicateEmail(): void
    {
        $user = (new User())
            ->setEmail('owner@example.com')
            ->setPseudonym('Owner');
        $this->setEntityId($user, 7);

        $existingUser = (new User())
            ->setEmail('next@example.com')
            ->setPseudonym('Other');
        $this->setEntityId($existingUser, 8);

        $request = Request::create('/api/users/me/email', 'PUT', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'email' => 'next@example.com',
            'currentPassword' => 'secret123',
        ], JSON_THROW_ON_ERROR));

        $this->security->method('getUser')->willReturn($user);
        $this->passwordHasher->method('isPasswordValid')->with($user, 'secret123')->willReturn(true);
        $this->userRepository->method('findOneBy')->with(['email' => 'next@example.com'])->willReturn($existingUser);
        $this->entityManager->expects(self::never())->method('flush');

        $this->expectException(ConflictHttpException::class);

        $this->action->__invoke($request);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}
