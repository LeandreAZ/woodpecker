<?php

namespace App\Service;

use App\Entity\AuthenticationEvent;
use App\Entity\User;
use App\Enum\AuthenticationEventType;
use App\Repository\AuthenticationEventRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;

final class AuthenticationEventRecorder
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly AuthenticationEventRepository $authenticationEventRepository,
    ) {
    }

    public function record(User $user, AuthenticationEventType|string $type, Request $request, ?string $logoutReason = null): AuthenticationEvent
    {
        $normalizedType = $type instanceof AuthenticationEventType ? $type : AuthenticationEventType::from($type);
        $tokenFingerprint = AuthenticationEventType::Logout === $normalizedType ? $this->extractBearerTokenFingerprint($request) : null;

        if (null !== $tokenFingerprint) {
            $existingEvent = $this->authenticationEventRepository->findOneByTokenFingerprint($tokenFingerprint);
            if ($existingEvent instanceof AuthenticationEvent) {
                return $existingEvent;
            }
        }

        $event = (new AuthenticationEvent())
            ->setUser($user)
            ->setType($normalizedType)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setLogoutReason(AuthenticationEventType::Logout === $normalizedType ? $logoutReason : null)
            ->setTokenFingerprint($tokenFingerprint);

        $context = $this->extractClientContext($request->headers->get('User-Agent'));
        $event
            ->setPlatform($context['platform'])
            ->setBrowser($context['browser'])
            ->setDevice($context['device']);

        $this->entityManager->persist($event);
        $this->entityManager->flush();

        return $event;
    }

    /**
     * @return array{platform:?string,browser:?string,device:?string}
     */
    private function extractClientContext(?string $userAgent): array
    {
        $ua = strtolower(trim((string) $userAgent));

        if ('' === $ua) {
            return ['platform' => null, 'browser' => null, 'device' => null];
        }

        return [
            'platform' => $this->detectPlatform($ua),
            'browser' => $this->detectBrowser($ua),
            'device' => $this->detectDevice($ua),
        ];
    }

    private function detectPlatform(string $userAgent): ?string
    {
        return match (true) {
            str_contains($userAgent, 'windows') => 'Windows',
            str_contains($userAgent, 'android') => 'Android',
            str_contains($userAgent, 'iphone'), str_contains($userAgent, 'ipad'), str_contains($userAgent, 'ios') => 'iOS',
            str_contains($userAgent, 'mac os x'), str_contains($userAgent, 'macintosh') => 'macOS',
            str_contains($userAgent, 'linux') => 'Linux',
            default => null,
        };
    }

    private function detectBrowser(string $userAgent): ?string
    {
        return match (true) {
            str_contains($userAgent, 'edg/') => 'Edge',
            str_contains($userAgent, 'chrome/') && !str_contains($userAgent, 'edg/') => 'Chrome',
            str_contains($userAgent, 'firefox/') => 'Firefox',
            str_contains($userAgent, 'safari/') && !str_contains($userAgent, 'chrome/') => 'Safari',
            default => null,
        };
    }

    private function detectDevice(string $userAgent): ?string
    {
        return match (true) {
            str_contains($userAgent, 'ipad'), str_contains($userAgent, 'tablet') => 'Tablet',
            str_contains($userAgent, 'mobile'), str_contains($userAgent, 'iphone'), str_contains($userAgent, 'android') => 'Mobile',
            default => 'Desktop',
        };
    }

    private function extractBearerTokenFingerprint(Request $request): ?string
    {
        $authorizationHeader = trim((string) $request->headers->get('Authorization'));

        if (!str_starts_with($authorizationHeader, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($authorizationHeader, 7));

        return '' === $token ? null : hash('sha256', $token);
    }
}
