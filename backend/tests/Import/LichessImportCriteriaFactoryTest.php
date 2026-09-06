<?php

namespace App\Tests\Import;

use App\Import\LichessImportCriteriaFactory;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class LichessImportCriteriaFactoryTest extends TestCase
{
    public function testNormalizesCriteriaWithoutChangingTheDatasetContract(): void
    {
        $criteria = (new LichessImportCriteriaFactory())->fromJson(json_encode([
            'count' => '25',
            'minRating' => '1200',
            'maxRating' => 1800,
            'themes' => [' Mate ', 'fork', 'mate'],
            'distribution' => 'balanced',
            'themeDistribution' => [' MATE ' => '60', 'fork' => 40, 'bad' => -1],
            'opening' => ' Sicilian_Defense ',
            'phase' => 'middlegame',
            'minMoves' => 2,
            'maxMoves' => 5,
        ], JSON_THROW_ON_ERROR));

        self::assertSame([
            'count' => 25,
            'minRating' => 1200,
            'maxRating' => 1800,
            'themes' => ['mate', 'fork'],
            'excludedThemes' => [],
            'distribution' => 'custom',
            'themeDistribution' => ['mate' => 60, 'fork' => 40],
            'phase' => 'middlegame',
            'opening' => 'sicilian_defense',
            'sideToMove' => null,
            'minMoves' => 2,
            'maxMoves' => 5,
            'order' => 'random',
            'seed' => null,
        ], $criteria);
    }

    #[DataProvider('invalidCriteria')]
    public function testRejectsInvalidCriteria(string $json, string $message): void
    {
        $this->expectException(BadRequestHttpException::class);
        $this->expectExceptionMessage($message);
        (new LichessImportCriteriaFactory())->fromJson($json);
    }

    public static function invalidCriteria(): iterable
    {
        yield 'invalid JSON' => ['{', 'La configuration Lichess est invalide.'];
        yield 'scalar JSON' => ['true', 'La configuration Lichess est invalide.'];
        $base = ['count' => 10, 'minRating' => 100, 'maxRating' => 4000];
        foreach ([['count' => 0], ['count' => 1001], ['minRating' => 1800, 'maxRating' => 1200]] as $override) {
            yield [json_encode(array_replace($base, $override), JSON_THROW_ON_ERROR), 'Les critères Lichess sont invalides.'];
        }
        foreach ([['minMoves' => -1], ['minMoves' => 5, 'maxMoves' => 2]] as $override) {
            yield [json_encode(array_replace($base, $override), JSON_THROW_ON_ERROR), 'La longueur des puzzles est invalide.'];
        }
        yield 'distribution total' => [json_encode($base + ['distribution' => 'custom', 'themes' => ['mate'], 'themeDistribution' => ['mate' => 90]], JSON_THROW_ON_ERROR), 'La répartition personnalisée doit totaliser 100 %.'];
    }
}
