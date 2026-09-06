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

    public function testMixedCategoriesUseAlternativesForAvailability(): void
    {
        $connection = $this->createMock(Connection::class);
        $connection->method('fetchOne')->willReturnCallback(static function (string $sql, array $params = []): int {
            if (str_contains($sql, 'count(*)')) {
                self::assertStringContainsString('(themes && :themes::text[] OR opening_tags && :openings::text[])', $sql);
                self::assertSame('{discoveredattack,endgame}', $params['themes']);
                self::assertSame('{sicilian_defense}', $params['openings']);
            }
            return 1;
        });
        $criteria = $this->criteria();
        $criteria['themes'] = ['discoveredattack', 'endgame', 'opening:sicilian_defense'];
        self::assertSame(1, (new LichessDatasetProvider($connection))->count($criteria));
    }

    public function testCustomDistributionAllocatesOpeningAndThemeSeparatelyWithoutDuplicates(): void
    {
        $connection = $this->createMock(Connection::class);
        $connection->method('fetchOne')->willReturn(100);
        $connection->method('fetchAllAssociative')->willReturnCallback(static function (string $sql, array $params): array {
            $isOpening = str_contains($sql, 'opening_tags @> :requiredTheme');
            self::assertSame($isOpening ? 2 : 8, $params['limit']);
            self::assertSame($isOpening ? '{sicilian_defense}' : '{discoveredattack}', $params['requiredTheme']);
            self::assertArrayNotHasKey('phase', $params);
            self::assertArrayNotHasKey('opening', $params);
            if (!$isOpening) {
                self::assertStringContainsString('NOT (external_id = ANY(:excludedIds::text[]))', $sql);
                self::assertSame('{opening-0,opening-1}', $params['excludedIds']);
            }
            $rows = [];
            for ($i = 0; $i < $params['limit']; ++$i) {
                $rows[] = ['external_id' => ($isOpening ? 'opening-' : 'theme-') . $i,
                    'fen' => '8/8/8/8/8/8/4K3/7k w - - 0 1', 'moves' => 'e2e3', 'rating' => 1500,
                    'themes' => $isOpening ? '{endgame}' : '{discoveredattack}',
                    'opening_tags' => $isOpening ? '{sicilian_defense}' : '{}'];
            }
            return $rows;
        });
        $criteria = $this->criteria();
        $criteria['count'] = 10;
        $criteria['themes'] = ['opening:sicilian_defense', 'discoveredattack'];
        $criteria['distribution'] = 'custom';
        $criteria['themeDistribution'] = ['opening:sicilian_defense' => 20, 'discoveredattack' => 80];
        $selection = (new LichessDatasetProvider($connection))->select($criteria);
        self::assertCount(10, $selection);
        self::assertSame(['endgame'], $selection[0]->themes);
        self::assertCount(10, array_unique(array_map(static fn ($puzzle) => $puzzle->sourceId, $selection)));
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
