<?php

namespace App\Import;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class LichessImportCriteriaFactory
{
    /** @return array<string, mixed> */
    public function fromJson(string $content): array
    {
        $payload = json_decode($content ?: '{}', true);
        if (!is_array($payload)) { throw new BadRequestHttpException('La configuration Lichess est invalide.'); }

        $count = filter_var($payload['count'] ?? null, FILTER_VALIDATE_INT);
        $minRating = filter_var($payload['minRating'] ?? null, FILTER_VALIDATE_INT);
        $maxRating = filter_var($payload['maxRating'] ?? null, FILTER_VALIDATE_INT);
        if (false === $count || $count < 1 || $count > 1000 || false === $minRating || false === $maxRating || $minRating < 100 || $maxRating > 4000 || $minRating > $maxRating) {
            throw new BadRequestHttpException('Les critères Lichess sont invalides.');
        }

        $minMoves = $this->optionalPositiveInteger($payload['minMoves'] ?? null);
        $maxMoves = $this->optionalPositiveInteger($payload['maxMoves'] ?? null);
        if ((null !== $minMoves && null !== $maxMoves && $minMoves > $maxMoves)
            || (null !== ($payload['minMoves'] ?? null) && null === $minMoves)
            || (null !== ($payload['maxMoves'] ?? null) && null === $maxMoves)) {
            throw new BadRequestHttpException('La longueur des puzzles est invalide.');
        }

        $themes = $this->normalizedList($payload['themes'] ?? []);
        $distribution = in_array($payload['distribution'] ?? null, ['custom', 'balanced'], true) ? 'custom' : 'random';
        $themeDistribution = $this->normalizedDistribution($payload['themeDistribution'] ?? []);
        if ('custom' === $distribution && [] !== $themes && 100 !== array_sum(array_intersect_key($themeDistribution, array_flip($themes)))) {
            throw new BadRequestHttpException('La répartition personnalisée doit totaliser 100 %.');
        }

        return [
            'count' => $count,
            'minRating' => $minRating,
            'maxRating' => $maxRating,
            'themes' => $themes,
            'excludedThemes' => [],
            'distribution' => $distribution,
            'themeDistribution' => $themeDistribution,
            'phase' => in_array($payload['phase'] ?? null, ['opening', 'middlegame', 'endgame'], true) ? $payload['phase'] : null,
            'opening' => is_string($payload['opening'] ?? null) ? (strtolower(trim($payload['opening'])) ?: null) : null,
            'sideToMove' => null,
            'minMoves' => $minMoves,
            'maxMoves' => $maxMoves,
            'order' => 'random',
            'seed' => null,
        ];
    }

    private function optionalPositiveInteger(mixed $value): ?int
    {
        if (null === $value || '' === $value) { return null; }
        $integer = filter_var($value, FILTER_VALIDATE_INT);
        return false === $integer || $integer < 1 ? null : $integer;
    }

    /** @return list<string> */
    private function normalizedList(mixed $values): array
    {
        if (!is_array($values)) { return []; }
        return array_values(array_unique(array_filter(array_map(static fn ($value): string => strtolower(trim((string) $value)), $values))));
    }

    /** @return array<string, int> */
    private function normalizedDistribution(mixed $values): array
    {
        if (!is_array($values)) { return []; }

        $distribution = [];
        foreach ($values as $theme => $percentage) {
            $normalizedTheme = strtolower(trim((string) $theme));
            $normalizedPercentage = filter_var($percentage, FILTER_VALIDATE_INT);
            if ('' === $normalizedTheme || false === $normalizedPercentage || $normalizedPercentage < 0 || $normalizedPercentage > 100) {
                continue;
            }
            $distribution[$normalizedTheme] = $normalizedPercentage;
        }

        return $distribution;
    }

}
