<?php

namespace App\Tests\Controller;

use App\Controller\AuthLogoutAction;
use App\Repository\AuthenticationEventRepository;
use App\Entity\User;
use App\Enum\AuthenticationEventType;
use App\Service\AuthenticationEventRecorder;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class AuthLogoutActionTest extends TestCase
{
    public function testRecordsLogoutForAuthenticatedUser(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);
        $recorder = new AuthenticationEventRecorder($entityManager, $authenticationEventRepository);
        $user = (new User())->setEmail('owner@example.com');
        $action = new class($recorder, $user) extends AuthLogoutAction {
            public function __construct(AuthenticationEventRecorder $authenticationEventRecorder, private readonly ?User $testUser)
            {
                parent::__construct($authenticationEventRecorder);
            }

            public function getUser(): ?User
            {
                return $this->testUser;
            }
        };

        $authenticationEventRepository->expects(self::once())->method('findOneByTokenFingerprint')->with(hash('sha256', 'manual-token'))->willReturn(null);
        $entityManager->expects(self::once())->method('persist')->with(self::callback(function ($event) use ($user): bool {
            self::assertSame($user, $event->getUser());
            self::assertSame(AuthenticationEventType::Logout->value, $event->getType());
            self::assertSame('manual', $event->getLogoutReason());
            self::assertSame(hash('sha256', 'manual-token'), $event->getTokenFingerprint());

            return true;
        }));
        $entityManager->expects(self::once())->method('flush');

        $response = $action->__invoke(Request::create('/api/auth/logout', 'POST', server: [
            'HTTP_AUTHORIZATION' => 'Bearer manual-token',
        ]));

        self::assertSame(Response::HTTP_NO_CONTENT, $response->getStatusCode());
    }

    public function testRejectsAnonymousLogout(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);
        $recorder = new AuthenticationEventRecorder($entityManager, $authenticationEventRepository);
        $action = new class($recorder) extends AuthLogoutAction {
            public function __construct(AuthenticationEventRecorder $authenticationEventRecorder)
            {
                parent::__construct($authenticationEventRecorder);
            }

            public function getUser(): ?User
            {
                return null;
            }
        };

        $authenticationEventRepository->expects(self::never())->method('findOneByTokenFingerprint');
        $entityManager->expects(self::never())->method('persist');
        $entityManager->expects(self::never())->method('flush');
        $this->expectException(AccessDeniedHttpException::class);

        $action->__invoke(Request::create('/api/auth/logout', 'POST'));
    }
}
