<?php

declare(strict_types=1);

namespace App\Tests\Import;

use App\Import\LichessDatasetProvider;
use Doctrine\DBAL\Connection;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class LichessDatasetProviderTest extends TestCase
{
    public function testCountsAndSelectsThroughTheCatalogWithoutGlobalSort(): void
    {
        $connection = $this->createMock(Connection::class);
        $queries = [];
        $connection->method("fetchOne")->willReturnCallback(static function (string $sql): int|bool {
            return str_contains($sql, "SELECT EXISTS") ? true : 3;
        });
        $connection->method("fetchAllAssociative")->willReturnCallback(static function (string $sql) use (&$queries): array {
            $queries[] = $sql;

            return [
                ["external_id" => "fixture-fork", "fen" => "8/8/8/8/8/8/4K3/7k w - - 0 1", "moves" => "e2e3", "rating" => 1500, "themes" => "{fork}", "opening_tags" => "{}"],
                ["external_id" => "fixture-pin", "fen" => "8/8/8/8/8/8/4K3/7k w - - 0 1", "moves" => "e2e3 e7e6", "rating" => 1750, "themes" => "{pin}", "opening_tags" => "{}"],
            ];
        });
        $provider = new LichessDatasetProvider($connection);
        $criteria = $this->criteria();

        self::assertSame(3, $provider->count($criteria));
        $selected = $provider->select($criteria);

        self::assertSame(["fixture-fork", "fixture-pin"], array_map(static fn ($puzzle): ?string => $puzzle->sourceId, $selected));
        self::assertStringContainsString("lichess_catalog_puzzle", $queries[0]);
        self::assertStringContainsString("ORDER BY external_id", $queries[0]);
        self::assertStringNotContainsString("ORDER BY md5", $queries[0]);
    }

    public function testReportsAnExplicitStateWhenTheCatalogIsEmpty(): void
    {
        $connection = $this->createMock(Connection::class);
        $connection->method("fetchOne")->willReturn(false);
        $provider = new LichessDatasetProvider($connection);

        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage("catalogue Lichess est vide");
        $provider->count($this->criteria());
    }

    /** $return array<string, mixed> */
    private function criteria(): array
    {
        return [
            "count" => 2,
            "minRating" => 1200,
            "maxRating" => 2200,
            "themes" => [],
            "excludedThemes" => [],
            "distribution" => "random",
            "themeDistribution" => [],
            "phase" => null,
            "opening" => null,
            "sideToMove" => null,
            "minMoves" => null,
            "maxMoves" => null,
            "order" => "random",
            "seed" => "fixture-seed",
        ];
    }
}
