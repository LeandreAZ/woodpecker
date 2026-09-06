<?php
namespace App\Controller;

use App\Entity\Training;
use App\Entity\User;
use App\Import\CsvPuzzleParser;
use App\Import\LichessDatasetProvider;
use App\Import\PuzzleImportValidationException;
use App\Import\TrainingCsvAnalysisService;
use App\Import\TrainingPuzzleImportService;
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Psr\Cache\CacheItemPoolInterface;

final class TrainingPuzzleImportAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingRepository $trainingRepository,
        private readonly CsvPuzzleParser $csvPuzzleParser,
        private readonly LichessDatasetProvider $lichessDatasetProvider,
        private readonly TrainingCsvAnalysisService $csvAnalysisService,
        private readonly TrainingPuzzleImportService $importService,
        private readonly CacheItemPoolInterface $cache,
    ) {}

    #[Route('/api/trainings/{id}/imports/csv/analyze', name: 'api_training_csv_import_analyze', methods: ['POST'])]
    public function analyzeCsv(int $id, Request $request): JsonResponse
    {
        $training = $this->trainingForCurrentUser($id);
        $analysis = $this->csvAnalysisService->prepareForTraining($training, $this->csvPuzzleParser->parseUpload($request->files->get('file')));
        $analysisId = bin2hex(random_bytes(16));
        $cacheItem = $this->cache->getItem('csv-import-' . $id . '-' . $analysisId);
        $cacheItem->set($analysis)->expiresAfter(900);
        $this->cache->save($cacheItem);
        return new JsonResponse(['analysisId' => $analysisId,
            'totalRows' => $analysis['total'],
            'usefulRowCount' => $analysis['usefulRowCount'] ?? $analysis['total'],
            'validCount' => $analysis['validCount'],
            'errorCount' => count($analysis['errors']),
            'duplicateCount' => $analysis['duplicateCount'],
            'importableCount' => $analysis['importableCount'],
            'detectedHeaderCount' => $analysis['detectedHeaderCount'] ?? 0,
            'expectedHeaderCount' => $analysis['expectedHeaderCount'] ?? 0,
            'errors' => $analysis['errors'],
            'duplicates' => $analysis['duplicates'],
            'rows' => $analysis['rows'],
            'preview' => array_map(static fn (array $row): array => ['rating' => (int) ($row['rating'] ?? 0), 'themes' => is_array($row['themes'] ?? null) ? array_values($row['themes']) : []], array_slice(array_values(array_filter($analysis['rows'], static fn (array $row): bool => ($row['status'] ?? null) === 'valid')), 0, 20)),
        ]);
    }

    #[Route('/api/trainings/{id}/imports/csv', name: 'api_training_csv_import', methods: ['POST'])]
    public function importCsv(int $id, Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $training = $this->trainingForCurrentUser($id);
        $analysisId = trim((string) $request->request->get('analysisId'));
        if ('' === $analysisId) { throw new BadRequestHttpException('Analyse CSV expirée. Analysez à nouveau le fichier.'); }
        $cacheItem = $this->cache->getItem('csv-import-' . $id . '-' . $analysisId);
        $analysis = $cacheItem->isHit() ? $cacheItem->get() : null;
        if (!is_array($analysis)) { throw new BadRequestHttpException('Analyse CSV expirée. Analysez à nouveau le fichier.'); }
        $skipDuplicates = $this->requestBoolean($request->request->get('skipDuplicates'), true);
        $skipErroredPuzzles = $this->requestBoolean($request->request->get('skipErroredPuzzles'), true);
        if ([] !== $analysis['errors'] && !$skipErroredPuzzles) { throw new PuzzleImportValidationException($analysis['errors']); }

        $puzzles = $this->csvAnalysisService->puzzlesForImport($analysis, $skipDuplicates);
        $cacheItem->expiresAfter(1); $this->cache->save($cacheItem);
        return new JsonResponse($this->importService->import($user, $training, $puzzles, 'csv', false), 201);
    }

    #[Route('/api/trainings/{id}/imports/lichess/options', name: 'api_training_lichess_import_options', methods: ['GET'])]
    public function lichessOptions(int $id): JsonResponse
    {
        $this->trainingForCurrentUser($id);
        $item = $this->cache->getItem('lichess-filter-options-v1');
        if (!$item->isHit()) {
            $item->set($this->lichessDatasetProvider->filterOptions())->expiresAfter(3600);
            $this->cache->save($item);
        }
        return new JsonResponse($item->get());
    }

    #[Route('/api/trainings/{id}/imports/lichess/availability', name: 'api_training_lichess_import_availability', methods: ['POST'])]
    public function lichessAvailability(int $id, Request $request): JsonResponse
    {
        $this->trainingForCurrentUser($id);

        if (!$this->lichessDatasetProvider->isConfigured()) {
            return new JsonResponse(['availableCount' => null]);
        }

        return new JsonResponse([
            'availableCount' => $this->lichessDatasetProvider->count($this->lichessCriteria($request)),
        ]);
    }

    #[Route('/api/trainings/{id}/imports/lichess', name: 'api_training_lichess_import', methods: ['POST'])]
    public function importLichess(int $id, Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $training = $this->trainingForCurrentUser($id);
        $puzzles = $this->lichessDatasetProvider->select($this->lichessCriteria($request));

        return new JsonResponse($this->importService->import($user, $training, $puzzles, 'lichess'), 201);
    }

    /** @return array<string, mixed> */
    private function lichessCriteria(Request $request): array
    {
        $payload = json_decode($request->getContent() ?: '{}', true);
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

    private function requestBoolean(mixed $value, bool $default): bool
    {
        if (null === $value || '' === $value) { return $default; }

        return filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? $default;
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

    private function currentUser(): User
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) { throw new NotFoundHttpException(); }
        return $user;
    }

    private function trainingForCurrentUser(int $id): Training
    {
        $training = $this->trainingRepository->findOneOwnedByUser($id, $this->currentUser());
        if (!$training instanceof Training) { throw new NotFoundHttpException(); }
        return $training;
    }
}
