<?php
namespace App\Tests\Import;

use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Import\NormalizedPuzzle;
use App\Import\TrainingCsvAnalysisService;
use PHPUnit\Framework\TestCase;

final class TrainingCsvAnalysisServiceTest extends TestCase
{
    public function testPrepareForTrainingMarksTrainingDuplicatesAndComputesStrictImportableCount(): void
    {
        $service = new TrainingCsvAnalysisService();
        $training = new Training();
        $training->addTrainingPuzzle(
            (new TrainingPuzzle())
                ->setPuzzle(
                    (new Puzzle())
                        ->setSource('csv')
                        ->setExternalId('existing-1')
                        ->setFen('6k1/5ppp/8/7Q/8/3B4/6PP/6K1 w - - 0 1')
                        ->setSolution(['h5h7'])
                        ->setThemes(['mate'])
                        ->setRating(1800),
                )
                ->setPosition(0),
        );

        $duplicatePuzzle = new NormalizedPuzzle('existing-1', '6k1/5ppp/8/7Q/8/3B4/6PP/6K1 w - - 0 1', ['h5h7'], 1800, ['mate']);
        $freshPuzzle = new NormalizedPuzzle('fresh-1', '6k1/5ppp/8/8/8/3B4/6PP/6K1 w - - 0 1', ['g2g3'], 1500, ['quietmove']);
        $analysis = [
            'puzzles' => [$duplicatePuzzle, $freshPuzzle],
            'errors' => [],
            'duplicates' => [['line' => 4, 'message' => 'Doublon detecte dans le fichier.']],
            'rows' => [
                ['line' => 2, 'status' => 'valid', 'rating' => 1800, 'themes' => ['mate'], 'sourceId' => 'existing-1', 'fingerprint' => $duplicatePuzzle->fingerprint()],
                ['line' => 3, 'status' => 'valid', 'rating' => 1500, 'themes' => ['quietmove'], 'sourceId' => 'fresh-1', 'fingerprint' => $freshPuzzle->fingerprint()],
                ['line' => 4, 'status' => 'duplicate', 'duplicateReason' => 'file', 'message' => 'Doublon detecte dans le fichier.'],
            ],
            'total' => 3,
        ];

        $prepared = $service->prepareForTraining($training, $analysis);

        self::assertSame(1, $prepared['validCount']);
        self::assertSame(2, $prepared['duplicateCount']);
        self::assertSame(1, $prepared['importableCount']);
        self::assertSame('duplicate', $prepared['rows'][0]['status']);
        self::assertSame('training', $prepared['rows'][0]['duplicateReason']);
        self::assertCount(1, $prepared['importablePuzzles']);
        self::assertCount(1, $prepared['duplicatePuzzles']);
    }

    public function testPuzzlesForImportOptionallyReincludesTrainingDuplicates(): void
    {
        $service = new TrainingCsvAnalysisService();
        $importable = new NormalizedPuzzle('fresh-1', 'fen-a', ['a2a4'], 1200, ['fork']);
        $duplicate = new NormalizedPuzzle('existing-1', 'fen-b', ['b2b4'], 1300, ['pin']);
        $analysis = ['importablePuzzles' => [$importable], 'duplicatePuzzles' => [$duplicate]];

        self::assertSame([$importable], $service->puzzlesForImport($analysis, true));
        self::assertSame([$importable, $duplicate], $service->puzzlesForImport($analysis, false));
    }
}
