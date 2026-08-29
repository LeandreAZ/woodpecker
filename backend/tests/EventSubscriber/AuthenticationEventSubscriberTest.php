<?php

namespace App\Tests\EventSubscriber;

use App\Entity\User;
use App\Enum\AuthenticationEventType;
use App\EventSubscriber\AuthenticationEventSubscriber;
use App\Repository\AuthenticationEventRepository;
use App\Service\AuthenticationEventRecorder;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authenticator\AuthenticatorInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;

final class AuthenticationEventSubscriberTest extends TestCase
{
    public function testRecordsConnectionOnlyForRealLoginCheckSuccess(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);
        $subscriber = new AuthenticationEventSubscriber(new AuthenticationEventRecorder($entityManager, $authenticationEventRepository));
        $user = (new User())->setEmail('owner@example.com');

        $authenticationEventRepository->expects(self::never())->method('findOneByTokenFingerprint');
        $entityManager->expects(self::once())->method('persist')->with(self::callback(function ($event) use ($user): bool {
            self::assertSame($user, $event->getUser());
            self::assertSame(AuthenticationEventType::Login->value, $event->getType());

            return true;
        }));
        $entityManager->expects(self::once())->method('flush');

        $subscriber->onLoginSuccess($this->createEvent($user, Request::create('/api/login_check', 'POST'), 'login'));
        $subscriber->onLoginSuccess($this->createEvent($user, Request::create('/api/trainings', 'GET'), 'api'));
    }

    private function createEvent(User $user, Request $request, string $firewallName): LoginSuccessEvent
    {
        $passport = new SelfValidatingPassport(new UserBadge($user->getUserIdentifier(), static fn (): User => $user));

        return new LoginSuccessEvent(
            $this->createMock(AuthenticatorInterface::class),
            $passport,
            $this->createMock(TokenInterface::class),
            $request,
            new Response(),
            $firewallName,
            null,
        );
    }
}
