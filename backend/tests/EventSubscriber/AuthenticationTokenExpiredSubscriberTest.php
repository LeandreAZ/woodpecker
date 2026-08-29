<?php

namespace App\Tests\EventSubscriber;

use App\Entity\User;
use App\Enum\AuthenticationEventType;
use App\EventSubscriber\AuthenticationTokenExpiredSubscriber;
use App\Repository\AuthenticationEventRepository;
use App\Repository\UserRepository;
use App\Service\AuthenticationEventRecorder;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTExpiredEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Exception\ExpiredTokenException;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticationTokenExpiredSubscriberTest extends TestCase
{
    public function testRecordsOneExpiredLogoutForAnActuallyExpiredJwt(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);
        $userRepository = $this->createMock(UserRepository::class);
        $jwtTokenManager = $this->createMock(JWTTokenManagerInterface::class);
        $subscriber = new AuthenticationTokenExpiredSubscriber(
            new AuthenticationEventRecorder($entityManager, $authenticationEventRepository),
            $userRepository,
            $jwtTokenManager,
        );
        $user = (new User())->setEmail('owner@example.com');
        $token = $this->buildJwt(['username' => 'owner@example.com', 'exp' => 1787950000]);
        $request = Request::create('/api/history/overview', 'GET', server: [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        ]);

        $jwtTokenManager->expects(self::once())->method('getUserIdClaim')->willReturn('username');
        $userRepository->expects(self::once())->method('findOneBy')->with(['email' => 'owner@example.com'])->willReturn($user);
        $authenticationEventRepository->expects(self::once())
            ->method('findOneByTokenFingerprint')
            ->with(hash('sha256', $token))
            ->willReturn(null);
        $entityManager->expects(self::once())->method('persist')->with(self::callback(function ($event) use ($user, $token): bool {
            self::assertSame($user, $event->getUser());
            self::assertSame(AuthenticationEventType::Logout->value, $event->getType());
            self::assertSame('expired', $event->getLogoutReason());
            self::assertSame(hash('sha256', $token), $event->getTokenFingerprint());

            return true;
        }));
        $entityManager->expects(self::once())->method('flush');

        $subscriber->onJwtExpired(new JWTExpiredEvent(new ExpiredTokenException(), new Response(), $request));
    }

    public function testIgnoresExpiredEventWhenTokenCannotBeMappedToAUser(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);
        $userRepository = $this->createMock(UserRepository::class);
        $jwtTokenManager = $this->createMock(JWTTokenManagerInterface::class);
        $subscriber = new AuthenticationTokenExpiredSubscriber(
            new AuthenticationEventRecorder($entityManager, $authenticationEventRepository),
            $userRepository,
            $jwtTokenManager,
        );
        $request = Request::create('/api/history/overview', 'GET', server: [
            'HTTP_AUTHORIZATION' => 'Bearer invalid-token',
        ]);

        $jwtTokenManager->expects(self::never())->method('getUserIdClaim');
        $userRepository->expects(self::never())->method('findOneBy');
        $authenticationEventRepository->expects(self::never())->method('findOneByTokenFingerprint');
        $entityManager->expects(self::never())->method('persist');
        $entityManager->expects(self::never())->method('flush');

        $subscriber->onJwtExpired(new JWTExpiredEvent(new ExpiredTokenException(), new Response(), $request));
    }

    private function buildJwt(array $payload): string
    {
        $header = rtrim(strtr(base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'RS256'], JSON_THROW_ON_ERROR)), '+/', '-_'), '=');
        $body = rtrim(strtr(base64_encode(json_encode($payload, JSON_THROW_ON_ERROR)), '+/', '-_'), '=');

        return $header . '.' . $body . '.signature';
    }
}
