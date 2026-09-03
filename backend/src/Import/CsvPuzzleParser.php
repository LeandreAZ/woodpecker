<?php
namespace App\Import;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Ryanhs\Chess\Chess;
final class CsvPuzzleParser
{
    private const MAX_FILE_SIZE = 26214400;
    private const REQUIRED_HEADERS = ['fen', 'moves', 'rating'];
    private const OPTIONAL_HEADERS = ['puzzleid', 'ratingdeviation', 'popularity', 'nbplays', 'themes', 'gameurl', 'openingtags'];

    /** @return array{puzzles: list<NormalizedPuzzle>, errors: list<array{line: int, message: string}>, duplicates: list<array{line: int, message: string}>, rows: list<array<string, mixed>>, total: int} */
    public function parseUpload(?UploadedFile $file): array
    {
        if (!$file instanceof UploadedFile || !$file->isValid()) { throw new BadRequestHttpException('Choisis un fichier CSV valide.'); }
        if ($file->getSize() > self::MAX_FILE_SIZE) { throw new BadRequestHttpException('Le fichier CSV ne peut pas depasser 25 Mo.'); }
        if ('csv' !== strtolower((string) $file->getClientOriginalExtension())) { throw new BadRequestHttpException('Le fichier doit etre au format CSV.'); }
        $handle = fopen($file->getPathname(), 'rb');
        if (false === $handle) { throw new BadRequestHttpException('Le fichier CSV est illisible.'); }
        try {
            $header = fgetcsv($handle);
            if (false === $header) { throw new BadRequestHttpException('Le fichier CSV est vide.'); }
            $headers = array_map(static fn (string $value): string => strtolower(trim(ltrim($value, "\xEF\xBB\xBF"))), $header);
            if ([] !== array_diff(self::REQUIRED_HEADERS, $headers) || [] !== array_diff($headers, [...self::REQUIRED_HEADERS, ...self::OPTIONAL_HEADERS]) || count($headers) !== count(array_unique($headers))) { throw new BadRequestHttpException('En-tete CSV invalide: FEN, Moves et Rating sont obligatoires.'); }
            $puzzles = [];
            $errors = [];
            $duplicates = [];
            $rows = [];
            $fingerprints = [];
            $sourceIds = [];
            $lineNumber = 1;
            while (false !== ($row = fgetcsv($handle))) {
                ++$lineNumber;
                if ([null] === $row || [] === $row) { continue; }
                if (count($row) !== count($headers)) {
                    $errors[] = ['line' => $lineNumber, 'message' => 'Nombre de colonnes invalide.'];
                    $rows[] = ['line' => $lineNumber, 'status' => 'error', 'message' => 'Nombre de colonnes invalide.'];
                    continue;
                }
                try {
                    $record = array_combine($headers, $row);
                    $puzzle = $this->normalizeRecord(is_array($record) ? $record : []);
                    if (isset($fingerprints[$puzzle->fingerprint()]) || (null !== $puzzle->sourceId && isset($sourceIds[$puzzle->sourceId]))) {
                        $duplicates[] = ['line' => $lineNumber, 'message' => 'Doublon detecte dans le fichier.'];
                        $rows[] = ['line' => $lineNumber, 'status' => 'duplicate', 'duplicateReason' => 'file', 'message' => 'Doublon detecte dans le fichier.', 'rating' => $puzzle->rating, 'themes' => $puzzle->themes, 'sourceId' => $puzzle->sourceId, 'fingerprint' => $puzzle->fingerprint()];
                        continue;
                    }
                    $fingerprints[$puzzle->fingerprint()] = true;
                    if (null !== $puzzle->sourceId) { $sourceIds[$puzzle->sourceId] = true; }
                    $puzzles[] = $puzzle;
                    $rows[] = ['line' => $lineNumber, 'status' => 'valid', 'rating' => $puzzle->rating, 'themes' => $puzzle->themes, 'sourceId' => $puzzle->sourceId, 'fingerprint' => $puzzle->fingerprint()];
                } catch (\InvalidArgumentException $exception) {
                    $errors[] = ['line' => $lineNumber, 'message' => $exception->getMessage()];
                    $rows[] = ['line' => $lineNumber, 'status' => 'error', 'message' => $exception->getMessage()];
                }
            }
            return ['puzzles' => $puzzles, 'errors' => $errors, 'duplicates' => $duplicates, 'rows' => $rows, 'total' => $lineNumber - 1];
        } finally { fclose($handle); }
    }

    /** @param array<string, string> $record */
    public function normalizeRecord(array $record): NormalizedPuzzle
    {
        $fen = trim((string) ($record['fen'] ?? '')); $moves = preg_split('/\s+/', trim((string) ($record['moves'] ?? ''))) ?: []; $rating = trim((string) ($record['rating'] ?? ''));
        if ('' === $fen) { throw new \InvalidArgumentException('FEN obligatoire absente.'); }
        $this->validateFenAndMoves($fen, $moves);
        if ([] === $moves || [''] === $moves) { throw new \InvalidArgumentException('Solution UCI obligatoire absente.'); }
        foreach ($moves as $index => $move) { if (1 !== preg_match('/^[a-h][1-8][a-h][1-8][qrbn]?$/i', $move)) { throw new \InvalidArgumentException(sprintf('Coup UCI invalide a la position %d.', $index + 1)); } }
        if (!ctype_digit($rating) || (int) $rating < 100 || (int) $rating > 4000) { throw new \InvalidArgumentException('Rating invalide (entier entre 100 et 4000 attendu).'); }
        foreach (['ratingdeviation', 'popularity'] as $field) { if ('' !== trim((string) ($record[$field] ?? '')) && !is_numeric($record[$field])) { throw new \InvalidArgumentException(sprintf('%s doit etre numerique.', $field)); } }
        if ('' !== trim((string) ($record['nbplays'] ?? '')) && !ctype_digit(trim((string) $record['nbplays']))) { throw new \InvalidArgumentException('NbPlays doit etre un entier positif ou nul.'); }
        if ('' !== trim((string) ($record['gameurl'] ?? '')) && false === filter_var($record['gameurl'], FILTER_VALIDATE_URL)) { throw new \InvalidArgumentException('GameUrl est invalide.'); }
        $sourceId = trim((string) ($record['puzzleid'] ?? ''));
        $themes = array_values(array_unique(array_filter(array_map(static fn (string $theme): string => strtolower(trim($theme)), preg_split('/[;,\s]+/', (string) ($record['themes'] ?? '')) ?: []))));
        $openingTags = array_values(array_unique(array_filter(array_map(static fn (string $tag): string => strtolower(trim($tag)), preg_split('/[;,\s]+/', (string) ($record['openingtags'] ?? '')) ?: []))));
        return new NormalizedPuzzle('' === $sourceId ? null : $sourceId, $fen, array_map('strtolower', $moves), (int) $rating, $themes, $openingTags);
    }

    /** @param list<string> $moves */
    private function validateFenAndMoves(string $fen, array $moves): void
    {
        $chess = new Chess();
        if (!$chess->load($fen)) {
            throw new \InvalidArgumentException('FEN invalide.');
        }
        foreach ($moves as $index => $move) {
            if (null === $chess->move([
                'from' => strtolower(substr($move, 0, 2)),
                'to' => strtolower(substr($move, 2, 2)),
                'promotion' => strtolower(substr($move, 4, 1)) ?: null,
            ])) {
                throw new \InvalidArgumentException(sprintf('Le coup UCI %d est illegal depuis la position courante.', $index + 1));
            }
        }
    }

}
