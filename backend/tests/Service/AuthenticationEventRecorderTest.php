<?php

namespace App\Tests\Service;

use App\Entity\AuthenticationEvent;
use App\Entity\User;
use App\Enum\AuthenticationEventType;
use App\Repository\AuthenticationEventRepository;
use App\Service\AuthenticationEventRecorder;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class AuthenticationEventRecorderTest extends TestCase
{
    private EntityManagerInterface&MockObject $entityManager;
    private AuthenticationEventRepository&MockObject $authenticationEventRepository;
    private AuthenticationEventRecorder $recorder;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);
        $this->recorder = new AuthenticationEventRecorder($this->entityManager, $this->authenticationEventRepository);
    }

    public function testRecordsLoginEventWithClientContext(): void
    {
        $user = (new User())->setEmail('owner@example.com');
        $request = Request::create('/api/login_check', 'POST', server: [
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        ]);

        $this->authenticationEventRepository->expects(self::never())->method('findOneByTokenFingerprint');
        $this->entityManager->expects(self::once())->method('persist')->with(self::callback(function ($event): bool {
            self::assertSame('login', $event->getType());
            self::assertSame('Windows', $event->getPlatform());
            self::assertSame('Chrome', $event->getBrowser());
            self::assertSame('Desktop', $event->getDevice());
            self::assertNull($event->getLogoutReason());
            self::assertNull($event->getTokenFingerprint());

            return true;
        }));
        $this->entityManager->expects(self::once())->method('flush');

        $this->recorder->record($user, AuthenticationEventType::Login, $request);
    }

    public function testRecordsLogoutEventWithoutInventingMissingContext(): void
    {
        $user = (new User())->setEmail('owner@example.com');
        $request = Request::create('/api/auth/logout', 'POST', server: [
            'HTTP_USER_AGENT' => '',
            'HTTP_AUTHORIZATION' => 'Bearer sample-logout-token',
        ]);

        $this->authenticationEventRepository->expects(self::once())
            ->method('findOneByTokenFingerprint')
            ->with(hash('sha256', 'sample-logout-token'))
            ->willReturn(null);
        $this->entityManager->expects(self::once())->method('persist')->with(self::callback(function ($event): bool {
            self::assertSame('logout', $event->getType());
            self::assertNull($event->getPlatform());
            self::assertNull($event->getBrowser());
            self::assertNull($event->getDevice());
            self::assertSame('manual', $event->getLogoutReason());
            self::assertSame(hash('sha256', 'sample-logout-token'), $event->getTokenFingerprint());

            return true;
        }));
        $this->entityManager->expects(self::once())->method('flush');

        $this->recorder->record($user, AuthenticationEventType::Logout, $request, 'manual');
    }

    public function testDoesNotPersistDuplicateLogoutForSameTokenFingerprint(): void
    {
        $user = (new User())->setEmail('owner@example.com');
        $request = Request::create('/api/auth/logout', 'POST', server: [
            'HTTP_AUTHORIZATION' => 'Bearer duplicate-token',
        ]);
        $existingEvent = (new AuthenticationEvent())
            ->setUser($user)
            ->setType(AuthenticationEventType::Logout)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setLogoutReason('expired')
            ->setTokenFingerprint(hash('sha256', 'duplicate-token'));

        $this->authenticationEventRepository->expects(self::once())
            ->method('findOneByTokenFingerprint')
            ->with(hash('sha256', 'duplicate-token'))
            ->willReturn($existingEvent);
        $this->entityManager->expects(self::never())->method('persist');
        $this->entityManager->expects(self::never())->method('flush');

        self::assertSame($existingEvent, $this->recorder->record($user, AuthenticationEventType::Logout, $request, 'expired'));
    }
}
