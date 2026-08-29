<?php

namespace App\EventSubscriber;

use App\Entity\User;
use App\Enum\AuthenticationEventType;
use App\Service\AuthenticationEventRecorder;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;

final class AuthenticationEventSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly AuthenticationEventRecorder $authenticationEventRecorder,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            LoginSuccessEvent::class => 'onLoginSuccess',
        ];
    }

    public function onLoginSuccess(LoginSuccessEvent $event): void
    {
        $user = $event->getUser();
        $request = $event->getRequest();

        if (!$user instanceof User) {
            return;
        }

        if ('login' !== $event->getFirewallName() || '/api/login_check' !== $request->getPathInfo()) {
            return;
        }

        $this->authenticationEventRecorder->record($user, AuthenticationEventType::Login, $request);
    }
}
