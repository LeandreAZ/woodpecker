<?php

namespace App\EventSubscriber;

use App\Entity\User;
use App\Enum\AuthenticationEventType;
use App\Repository\UserRepository;
use App\Service\AuthenticationEventRecorder;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTExpiredEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;

final class AuthenticationTokenExpiredSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly AuthenticationEventRecorder $authenticationEventRecorder,
        private readonly UserRepository $userRepository,
        private readonly JWTTokenManagerInterface $jwtTokenManager,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            Events::JWT_EXPIRED => 'onJwtExpired',
        ];
    }

    public function onJwtExpired(JWTExpiredEvent $event): void
    {
        $request = $event->getRequest();

        if (!$request instanceof Request) {
            return;
        }

        $token = $this->extractBearerToken($request);
        if (null === $token) {
            return;
        }

        $identifier = $this->extractUserIdentifier($token);
        if (null === $identifier) {
            return;
        }

        $user = $this->userRepository->findOneBy(['email' => $identifier]);
        if (!$user instanceof User) {
            return;
        }

        $this->authenticationEventRecorder->record($user, AuthenticationEventType::Logout, $request, 'expired');
    }

    private function extractBearerToken(Request $request): ?string
    {
        $authorizationHeader = trim((string) $request->headers->get('Authorization'));

        if (!str_starts_with($authorizationHeader, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($authorizationHeader, 7));

        return '' === $token ? null : $token;
    }

    private function extractUserIdentifier(string $token): ?string
    {
        $parts = explode('.', $token);
        if (3 !== count($parts)) {
            return null;
        }

        $payloadJson = $this->decodeBase64Url($parts[1]);
        if (null === $payloadJson) {
            return null;
        }

        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            return null;
        }

        $claim = (string) $this->jwtTokenManager->getUserIdClaim();
        $identifier = $payload[$claim] ?? null;

        return is_string($identifier) && '' !== trim($identifier) ? $identifier : null;
    }

    private function decodeBase64Url(string $value): ?string
    {
        $normalized = strtr($value, '-_', '+/');
        $padding = strlen($normalized) % 4;

        if (0 !== $padding) {
            $normalized .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode($normalized, true);

        return false === $decoded ? null : $decoded;
    }
}
