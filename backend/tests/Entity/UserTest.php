<?php

namespace App\Tests\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    public function testEnsureDefaultPseudonymGeneratesStableRandomValue(): void
    {
        $user = (new User())
            ->setEmail('owner@example.com')
            ->setPseudonym('');

        $user->ensureDefaultPseudonym();
        $generated = $user->getPseudonym();

        self::assertNotSame('', $generated);
        self::assertNotSame('owner', $generated);
        self::assertMatchesRegularExpression('/^(Woodpecker|Knight|Bishop|Rook|Puzzle|Trainer)(Focus|Tempo|Spark|Falcon|Comet|Blaze)\d{4}$/', $generated);

        $user->ensureDefaultPseudonym();

        self::assertSame($generated, $user->getPseudonym());
    }
}
