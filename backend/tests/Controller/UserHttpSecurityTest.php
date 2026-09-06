<?php

namespace App\Tests\Controller;

use PHPUnit\Framework\TestCase;

/** Real HTTP checks against the isolated E2E stack; never create users in the personal database. */
final class UserHttpSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        if ('1' !== getenv('WOODPECKER_E2E')) {
            self::markTestSkipped('Run inside compose.e2e.yaml to use the isolated database.');
        }
    }

    public function testRegistrationOverviewAndProtectedUserRoutes(): void
    {
        [$status] = $this->request('POST', '/api/users/me/avatar');
        self::assertSame(401, $status, 'Anonymous avatar upload must require authentication.');

        $email = 'security-'.bin2hex(random_bytes(12)).'@woodpecker.test';
        $password = 'E2e-password-2026!';
        [$status, $user] = $this->request('POST', '/api/users', [
            'email' => $email,
            'plainPassword' => $password,
        ]);
        self::assertSame(201, $status, json_encode($user));
        self::assertSame($email, $user['email']);
        self::assertArrayHasKey('id', $user);

        [$status, $login] = $this->request('POST', '/api/login_check', [
            'email' => $email,
            'password' => $password,
        ]);
        self::assertSame(200, $status);
        self::assertArrayHasKey('token', $login);
        $token = $login['token'];

        [$status, $overview] = $this->request('GET', '/api/users/me/overview', token: $token);
        self::assertSame(200, $status, json_encode($overview));

        foreach (['/api/users', '/api/users/'.$user['id']] as $path) {
            [$status] = $this->request('GET', $path, token: $token);
            self::assertContains($status, [404, 405], $path.' must not expose generic user reads.');
        }
    }

    /** @return array{int, array} */
    private function request(string $method, string $path, ?array $body = null, ?string $token = null): array
    {
        $headers = ['Content-Type: application/ld+json', 'Accept: application/ld+json'];
        if (null !== $token) {
            $headers[] = 'Authorization: Bearer '.$token;
        }
        $context = stream_context_create(['http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'content' => null === $body ? '' : json_encode($body, JSON_THROW_ON_ERROR),
            'ignore_errors' => true,
            'follow_location' => 0,
            'timeout' => 20,
        ]]);
        $response = file_get_contents('http://nginx'.$path, false, $context);
        self::assertNotFalse($response, $method.' '.$path);
        preg_match('/\s(\d{3})\s/', $http_response_header[0], $match);

        return [(int) $match[1], json_decode($response, true) ?? []];
    }
}
