<?php
namespace App\Import;

use App\Entity\Puzzle;
use App\Entity\Training;

final class TrainingCsvAnalysisService
{
    /** @param array{puzzles: list<NormalizedPuzzle>, errors: list<array{line: int, message: string}>, duplicates: list<array{line: int, message: string}>, rows: list<array<string, mixed>>, total: int}
     *  @return array{puzzles: list<NormalizedPuzzle>, errors: list<array{line: int, message: string}>, duplicates: list<array{line: int, message: string}>, rows: list<array<string, mixed>>, total: int, validCount: int, duplicateCount: int, importableCount: int, importablePuzzles: list<NormalizedPuzzle>, duplicatePuzzles: list<NormalizedPuzzle>}
     */
    public function prepareForTraining(Training $training, array $analysis, string $source = 'csv'): array
    {
        $existingKeys = $this->buildExistingTrainingPuzzleKeys($training);
        $rows = [];
        $duplicates = $analysis['duplicates'];
        $importablePuzzles = [];
        $duplicatePuzzles = [];
        $validCount = 0;
        $puzzleIndex = 0;

        foreach ($analysis['rows'] as $row) {
            if (($row['status'] ?? null) !== 'valid') {
                $rows[] = $row;
                continue;
            }

            $puzzle = $analysis['puzzles'][$puzzleIndex] ?? null;
            ++$puzzleIndex;

            if (!$puzzle instanceof NormalizedPuzzle) {
                $rows[] = $row;
                continue;
            }

            $candidateKeys = $this->buildPuzzleKeys($puzzle->fen, $puzzle->solution, $source, $puzzle->sourceId);
            if ($this->hasMatchingPuzzleKey($existingKeys, $candidateKeys)) {
                $duplicates[] = ['line' => (int) ($row['line'] ?? 0), 'message' => 'Puzzle deja present dans cet entrainement.'];
                $duplicatePuzzles[] = $puzzle;
                $rows[] = [...$row, 'status' => 'duplicate', 'duplicateReason' => 'training', 'message' => 'Puzzle deja present dans cet entrainement.'];
                continue;
            }

            $rows[] = $row;
            $importablePuzzles[] = $puzzle;
            ++$validCount;
        }

        return [
            ...$analysis,
            'rows' => $rows,
            'duplicates' => $duplicates,
            'validCount' => $validCount,
            'duplicateCount' => count($duplicates),
            'importableCount' => count($importablePuzzles),
            'importablePuzzles' => $importablePuzzles,
            'duplicatePuzzles' => $duplicatePuzzles,
        ];
    }

    /** @param array{importablePuzzles?: list<NormalizedPuzzle>, duplicatePuzzles?: list<NormalizedPuzzle>, puzzles?: list<NormalizedPuzzle>}
     *  @return list<NormalizedPuzzle>
     */
    public function puzzlesForImport(array $analysis, bool $skipDuplicates): array
    {
        $importablePuzzles = $analysis['importablePuzzles'] ?? $analysis['puzzles'] ?? [];
        if ($skipDuplicates) {
            return $importablePuzzles;
        }

        return [...$importablePuzzles, ...($analysis['duplicatePuzzles'] ?? [])];
    }

    /** @return array<string, true> */
    private function buildExistingTrainingPuzzleKeys(Training $training): array
    {
        $existingKeys = [];
        foreach ($training->getTrainingPuzzles() as $trainingPuzzle) {
            $puzzle = $trainingPuzzle->getPuzzle();
            if (!$puzzle instanceof Puzzle) {
                continue;
            }

            foreach ($this->buildPuzzleKeys($puzzle->getFen() ?? '', $puzzle->getSolution(), $puzzle->getSource(), $puzzle->getExternalId()) as $key) {
                $existingKeys[$key] = true;
            }
        }

        return $existingKeys;
    }

    /** @param list<string> $solution
     *  @return list<string>
     */
    private function buildPuzzleKeys(string $fen, array $solution, ?string $source, ?string $sourceId): array
    {
        $keys = [sprintf('fingerprint:%s', hash('sha256', $fen.'|'.implode(' ', $solution)))];
        if (null !== $source && null !== $sourceId && '' !== $sourceId) {
            $keys[] = sprintf('source:%s:%s', $source, $sourceId);
        }

        return $keys;
    }

    /** @param array<string, true> $existingKeys
     *  @param list<string> $candidateKeys
     */
    private function hasMatchingPuzzleKey(array $existingKeys, array $candidateKeys): bool
    {
        foreach ($candidateKeys as $candidateKey) {
            if (isset($existingKeys[$candidateKey])) {
                return true;
            }
        }

        return false;
    }
}
