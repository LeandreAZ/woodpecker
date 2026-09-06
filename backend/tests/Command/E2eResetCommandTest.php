<?php

namespace App\Tests\Command;

use App\Command\E2eResetCommand;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class E2eResetCommandTest extends TestCase
{
    public function testProductionIsRejectedWithoutReadingOrWritingData(): void
    {
        $this->assertResetRefused('prod', '1', null);
    }

    public function testMissingExplicitOptInIsRejected(): void
    {
        $this->assertResetRefused('dev', '', null);
    }

    public function testNormalDatabaseIsRejectedEvenWithOptIn(): void
    {
        $this->assertResetRefused('dev', '1', 'woodpecker');
    }

    private function assertResetRefused(string $environment, string $optIn, ?string $database): void
    {
        $previous = getenv('WOODPECKER_E2E');
        putenv('WOODPECKER_E2E='.$optIn);
        try {
            $db = $this->createMock(Connection::class);
            $db->expects($this->never())->method('executeStatement');
            $db->expects($this->never())->method('beginTransaction');
            if (null === $database) {
                $db->expects($this->never())->method('fetchOne');
            } else {
                $db->expects($this->once())->method('fetchOne')->with('SELECT current_database()')->willReturn($database);
            }
            $em = $this->createMock(EntityManagerInterface::class);
            $em->method('getConnection')->willReturn($db);
            $em->expects($this->never())->method('flush');
            $tester = new CommandTester(new E2eResetCommand($em, $this->createMock(UserPasswordHasherInterface::class), $environment));
            self::assertSame(1, $tester->execute([]));
            self::assertStringContainsString('Refused', $tester->getDisplay());
        } finally {
            putenv(false === $previous ? 'WOODPECKER_E2E' : 'WOODPECKER_E2E='.$previous);
        }
    }
}
