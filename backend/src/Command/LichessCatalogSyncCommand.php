<?php

declare(strict_types=1);

namespace App\Command;

use Doctrine\DBAL\Connection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: "app:lichess:sync-catalog", description: "Synchronise le catalogue PostgreSQL depuis le CSV Lichess local.")]
final class LichessCatalogSyncCommand extends Command
{
    private const BATCH_SIZE = 1000;

    public function __construct(private readonly Connection $connection)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption("file", null, InputOption::VALUE_REQUIRED, "Chemin du CSV Lichess.")
            ->addOption("truncate", null, InputOption::VALUE_NONE, "Remplace complètement le catalogue.");
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $path = (string) ($input->getOption("file") ?: getenv("LICHESS_PUZZLE_DATASET_PATH"));
        if ("" === $path || !is_file($path) || !is_readable($path)) {
            $io->error("CSV Lichess introuvable ou illisible. Configurez LICHESS_PUZZLE_DATASET_PATH ou utilisez --file.");

            return Command::FAILURE;
        }

        $handle = fopen($path, "rb");
        if (false === $handle) {
            $io->error("Impossible d ouvrir le CSV Lichess.");

            return Command::FAILURE;
        }

        $headers = fgetcsv($handle);
        if (false === $headers) {
            fclose($handle);
            $io->error("Le CSV Lichess est vide.");

            return Command::FAILURE;
        }
        $headers = array_map(static fn (string $value): string => strtolower(trim($value)), $headers);
        if (!in_array("puzzleid", $headers, true) || !in_array("fen", $headers, true) || !in_array("moves", $headers, true) || !in_array("rating", $headers, true)) {
            fclose($handle);
            $io->error("Le CSV Lichess ne contient pas les colonnes requises.");

            return Command::FAILURE;
        }

        $io->title("Synchronisation du catalogue Lichess");
        $io->text(sprintf("Source : %s", $path));
        $size = filesize($path) ?: 0;
        if ($input->getOption("truncate")) {
            $this->connection->executeStatement("TRUNCATE lichess_catalog_puzzle");
        }

        $rows = [];
        $lines = 1;
        $imported = 0;
        $skipped = 0;
        $startedAt = microtime(true);

        try {
            while (false !== ($row = fgetcsv($handle))) {
                ++$lines;
                if (count($row) !== count($headers)) {
                    ++$skipped;
                    continue;
                }
                $record = array_combine($headers, $row);
                $rating = filter_var($record["rating"] ?? null, FILTER_VALIDATE_INT);
                $id = trim((string) ($record["puzzleid"] ?? ""));
                $fen = trim((string) ($record["fen"] ?? ""));
                $moves = trim((string) ($record["moves"] ?? ""));
                if (false === $rating || "" === $id || "" === $fen || "" === $moves) {
                    ++$skipped;
                    continue;
                }

                $rows[] = [
                    $id,
                    $fen,
                    $moves,
                    $rating,
                    $this->arrayLiteral((string) ($record["themes"] ?? "")),
                    $this->arrayLiteral((string) ($record["openingtags"] ?? "")),
                    count(preg_split("/\s+/", $moves, -1, PREG_SPLIT_NO_EMPTY)),
                ];
                if (self::BATCH_SIZE === count($rows)) {
                    $imported += $this->flush($rows);
                    $rows = [];
                    if (0 === $imported % 10000) {
                        $percent = $size > 0 ? (int) round((ftell($handle) / $size) * 100) : 0;
                        $io->writeln(sprintf("%d lignes, %d puzzles, %d ignorés (%d%%)", $lines, $imported, $skipped, $percent));
                    }
                }
            }
            if ([] !== $rows) {
                $imported += $this->flush($rows);
            }
        } catch (\Throwable $exception) {
            $io->error(sprintf("Synchronisation interrompue après %d puzzles : %s", $imported, $exception->getMessage()));

            return Command::FAILURE;
        } finally {
            fclose($handle);
        }

        $io->success(sprintf("%d puzzles synchronisés, %d lignes ignorées en %.1f s.", $imported, $skipped, microtime(true) - $startedAt));

        return Command::SUCCESS;
    }

    /** $param list<array<int, int|string>> $rows */
    private function flush(array $rows): int
    {
        $values = [];
        $parameters = [];
        foreach ($rows as $row) {
            $values[] = "(?, ?, ?, ?, ?::text[], ?::text[], ?)";
            array_push($parameters, ...$row);
        }

        return $this->connection->executeStatement(
            "INSERT INTO lichess_catalog_puzzle (external_id, fen, moves, rating, themes, opening_tags, move_count) VALUES " . implode(",", $values) . " ON CONFLICT (external_id) DO UPDATE SET fen = EXCLUDED.fen, moves = EXCLUDED.moves, rating = EXCLUDED.rating, themes = EXCLUDED.themes, opening_tags = EXCLUDED.opening_tags, move_count = EXCLUDED.move_count",
            $parameters,
        );
    }

    private function arrayLiteral(string $value): string
    {
        $tags = preg_split("/\s+/", strtolower(trim($value)), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $tags = array_values(array_filter($tags, static fn (string $tag): bool => 1 === preg_match("/^[a-z0-9_-]+$/", $tag)));

        return "{" . implode(",", $tags) . "}";
    }
}
