<?php

namespace App\Tests\Controller;

use App\Controller\UserPasswordUpdateAction;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserPasswordUpdateActionTest extends TestCase
{
    private Security&MockObject $security;
    private EntityManagerInterface&MockObject $entityManager;
    private UserPasswordHasherInterface&MockObject $passwordHasher;
    private UserPasswordUpdateAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);

        $this->action = new UserPasswordUpdateAction(
            $this->security,
            $this->entityManager,
            $this->passwordHasher,
        );
    }

    public function testUpdatesPassword(): void
    {
        $user = (new User())
            ->setEmail('owner@example.com')
            ->setPseudonym('Owner')
            ->setPassword('old-hash');

        $request = Request::create('/api/users/me/password', 'PUT', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'currentPassword' => 'secret123',
            'newPassword' => 'new-secret-123',
            'confirmPassword' => 'new-secret-123',
        ], JSON_THROW_ON_ERROR));

        $this->security->method('getUser')->willReturn($user);
        $this->passwordHasher->method('isPasswordValid')->with($user, 'secret123')->willReturn(true);
        $this->passwordHasher->method('hashPassword')->with($user, 'new-secret-123')->willReturn('new-hash');
        $this->entityManager->expects(self::once())->method('persist')->with($user);
        $this->entityManager->expects(self::once())->method('flush');

        $response = $this->action->__invoke($request);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('new-hash', $user->getPassword());
        self::assertSame(['message' => 'Mot de passe mis à jour.'], $payload);
    }

    public function testRejectsInvalidCurrentPassword(): void
    {
        $user = (new User())
            ->setEmail('owner@example.com')
            ->setPseudonym('Owner');

        $request = Request::create('/api/users/me/password', 'PUT', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'currentPassword' => 'wrong',
            'newPassword' => 'new-secret-123',
            'confirmPassword' => 'new-secret-123',
        ], JSON_THROW_ON_ERROR));

        $this->security->method('getUser')->willReturn($user);
        $this->passwordHasher->method('isPasswordValid')->with($user, 'wrong')->willReturn(false);
        $this->entityManager->expects(self::never())->method('flush');

        $this->expectException(BadRequestHttpException::class);

        $this->action->__invoke($request);
    }
}
