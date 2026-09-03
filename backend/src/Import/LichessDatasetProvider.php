<?php

declare(strict_types=1);

namespace App\Import;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\ParameterType;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** Queries the indexed local PostgreSQL catalogue. The source CSV is never read at request time. */
final class LichessDatasetProvider
{
    public function __construct(private readonly Connection $connection)
    {
    }

    public function isConfigured(): bool
    {
        try {
            return (bool) $this->connection->fetchOne("SELECT EXISTS (SELECT 1 FROM lichess_catalog_puzzle)");
        } catch (\Throwable) {
            return false;
        }
    }

    /** $param array<string, mixed> $criteria */
    public function count(array $criteria): int
    {
        $this->assertCatalogAvailable();
        [$where, $parameters] = $this->filters($criteria);

        return (int) $this->connection->fetchOne("SELECT count(*) FROM lichess_catalog_puzzle WHERE " . implode(" AND ", $where), $parameters);
    }

    /** $param array<string, mixed> $criteria $return list<NormalizedPuzzle> */
    public function select(array $criteria): array
    {
        $this->assertCatalogAvailable();
        $requested = (int) $criteria["count"];
        $seed = (string) ($criteria["seed"] ?? bin2hex(random_bytes(12)));

        if ("custom" === ($criteria["distribution"] ?? "random") && [] !== ($criteria["themes"] ?? [])) {
            $selection = $this->selectCustomDistribution($criteria, $seed);
        } else {
            if ($this->count($criteria) < $requested) {
                throw new BadRequestHttpException(sprintf("Seulement %d puzzles Lichess correspondent aux critères demandés.", $this->count($criteria)));
            }
            $selection = $this->fetchSelection($criteria, $requested, $seed);
        }

        if (count($selection) !== $requested) {
            throw new BadRequestHttpException("Les critères demandés ne permettent pas de sélectionner le nombre requis de puzzles distincts.");
        }

        if ("ratingAsc" === ($criteria["order"] ?? "random")) {
            usort($selection, static fn (NormalizedPuzzle $left, NormalizedPuzzle $right): int => $left->rating <=> $right->rating);
        } elseif ("ratingDesc" === ($criteria["order"] ?? "random")) {
            usort($selection, static fn (NormalizedPuzzle $left, NormalizedPuzzle $right): int => $right->rating <=> $left->rating);
        }

        return $selection;
    }

    /** $param array<string, mixed> $criteria $return list<NormalizedPuzzle> */
    private function selectCustomDistribution(array $criteria, string $seed): array
    {
        $themes = array_values(array_filter($criteria["themes"] ?? [], static fn (mixed $theme): bool => is_string($theme)));
        $distribution = $criteria["themeDistribution"] ?? [];
        $selection = [];
        $excludedIds = [];
        $remaining = (int) $criteria["count"];

        foreach ($themes as $index => $theme) {
            $quota = count($themes) - 1 === $index
                ? $remaining
                : (int) floor(((int) $criteria["count"] * (int) ($distribution[$theme] ?? 0)) / 100);
            $remaining -= $quota;
            if (0 === $quota) {
                continue;
            }

            $available = $this->countForTheme($criteria, $theme, $excludedIds);
            if ($available < $quota) {
                throw new BadRequestHttpException(sprintf("Le thème %s ne contient que %d puzzles disponibles pour les %d demandés.", $theme, $available, $quota));
            }

            $puzzles = $this->fetchSelection($criteria, $quota, $seed . ":" . $theme, $theme, $excludedIds);
            if (count($puzzles) !== $quota) {
                throw new BadRequestHttpException(sprintf("Le thème %s ne permet pas une répartition sans doublon.", $theme));
            }
            foreach ($puzzles as $puzzle) {
                $excludedIds[] = (string) $puzzle->sourceId;
                $selection[] = $puzzle;
            }
        }

        return $selection;
    }

    /** $param array<string, mixed> $criteria $param list<string> $excludedIds */
    private function countForTheme(array $criteria, string $theme, array $excludedIds): int
    {
        [$where, $parameters] = $this->filters($criteria, $theme, $excludedIds);

        return (int) $this->connection->fetchOne("SELECT count(*) FROM lichess_catalog_puzzle WHERE " . implode(" AND ", $where), $parameters);
    }

    /** $param array<string, mixed> $criteria $param list<string> $excludedIds $return list<NormalizedPuzzle> */
    private function fetchSelection(array $criteria, int $limit, string $seed, ?string $requiredTheme = null, array $excludedIds = []): array
    {
        // The primary key cursor preserves a stable seed without sorting every compatible puzzle.
        $cursor = substr(hash("sha256", $seed), 0, 8);
        $selection = $this->fetchRows($criteria, $limit, $requiredTheme, $excludedIds, $cursor, true);
        if (count($selection) < $limit) {
            $usedIds = [...$excludedIds, ...array_map(static fn (NormalizedPuzzle $puzzle): string => (string) $puzzle->sourceId, $selection)];
            $selection = [...$selection, ...$this->fetchRows($criteria, $limit - count($selection), $requiredTheme, $usedIds, $cursor, false)];
        }

        return $selection;
    }

    /** $param array<string, mixed> $criteria $param list<string> $excludedIds $return list<NormalizedPuzzle> */
    private function fetchRows(array $criteria, int $limit, ?string $requiredTheme, array $excludedIds, string $cursor, bool $afterCursor): array
    {
        [$where, $parameters] = $this->filters($criteria, $requiredTheme, $excludedIds);
        $where[] = $afterCursor ? "external_id >= :cursor" : "external_id < :cursor";
        $parameters["cursor"] = $cursor;
        $parameters["limit"] = $limit;
        $rows = $this->connection->fetchAllAssociative(
            "SELECT external_id, fen, moves, rating, themes, opening_tags FROM lichess_catalog_puzzle WHERE " . implode(" AND ", $where) . " ORDER BY external_id LIMIT :limit",
            $parameters,
            ["limit" => ParameterType::INTEGER],
        );

        return array_map(fn (array $row): NormalizedPuzzle => new NormalizedPuzzle(
            $row["external_id"],
            $row["fen"],
            preg_split("/\s+/", trim($row["moves"]), -1, PREG_SPLIT_NO_EMPTY) ?: [],
            (int) $row["rating"],
            $this->postgresArray($row["themes"]),
            $this->postgresArray($row["opening_tags"]),
        ), $rows);
    }

    /** $param array<string, mixed> $criteria $param list<string> $excludedIds $return array{list<string>, array<string, mixed>} */
    private function filters(array $criteria, ?string $requiredTheme = null, array $excludedIds = []): array
    {
        $where = ["rating BETWEEN :minRating AND :maxRating"];
        $parameters = ["minRating" => (int) $criteria["minRating"], "maxRating" => (int) $criteria["maxRating"]];
        if (null !== ($criteria["minMoves"] ?? null)) {
            $where[] = "move_count >= :minMoves";
            $parameters["minMoves"] = (int) $criteria["minMoves"];
        }
        if (null !== ($criteria["maxMoves"] ?? null)) {
            $where[] = "move_count <= :maxMoves";
            $parameters["maxMoves"] = (int) $criteria["maxMoves"];
        }
        if (null !== $requiredTheme) {
            $where[] = "themes @> :requiredTheme::text[]";
            $parameters["requiredTheme"] = $this->arrayLiteral([$requiredTheme]);
        } elseif ([] !== ($criteria["themes"] ?? [])) {
            $where[] = "themes && :themes::text[]";
            $parameters["themes"] = $this->arrayLiteral($criteria["themes"]);
        }
        if ([] !== ($criteria["excludedThemes"] ?? [])) {
            $where[] = "NOT (themes && :excludedThemes::text[])";
            $parameters["excludedThemes"] = $this->arrayLiteral($criteria["excludedThemes"]);
        }
        if (null !== ($criteria["phase"] ?? null)) {
            $where[] = "themes @> :phase::text[]";
            $parameters["phase"] = $this->arrayLiteral([(string) $criteria["phase"]]);
        }
        if (null !== ($criteria["opening"] ?? null)) {
            $where[] = "opening_tags && :opening::text[]";
            $parameters["opening"] = $this->arrayLiteral([(string) $criteria["opening"]]);
        }
        if (null !== ($criteria["sideToMove"] ?? null)) {
            $where[] = "split_part(fen, ' ', 2) = :sideToMove";
            $parameters["sideToMove"] = "white" === $criteria["sideToMove"] ? "w" : "b";
        }
        if ([] !== $excludedIds) {
            $where[] = "NOT (external_id = ANY(:excludedIds::text[]))";
            $parameters["excludedIds"] = $this->arrayLiteral($excludedIds);
        }

        return [$where, $parameters];
    }

    /** $param list<string> $values */
    private function arrayLiteral(array $values): string
    {
        $safeValues = array_filter($values, static fn (mixed $value): bool => is_string($value) && 1 === preg_match("/^[a-z0-9_-]+$/i", $value));

        return "{" . implode(",", $safeValues) . "}";
    }

    /** $return list<string> */
    private function postgresArray(mixed $value): array
    {
        if (!is_string($value) || "{}" === $value) {
            return [];
        }

        return array_values(array_filter(explode(",", trim($value, "{}"))));
    }

    private function assertCatalogAvailable(): void
    {
        if (!$this->isConfigured()) {
            throw new BadRequestHttpException("Le catalogue Lichess est vide. Exécutez app:lichess:sync-catalog avant de générer des puzzles.");
        }
    }
}
