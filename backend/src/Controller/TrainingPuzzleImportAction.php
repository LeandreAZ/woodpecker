<?php
namespace App\Controller;

use App\Entity\Training;
use App\Entity\User;
use App\Import\CsvPuzzleParser;
use App\Import\LichessDatasetProvider;
use App\Import\LichessImportCriteriaFactory;
use App\Import\PuzzleImportValidationException;
use App\Import\TrainingCsvAnalysisService;
use App\Import\TrainingPuzzleImportService;
use App\Import\CsvAnalysisStore;
use App\Repository\TrainingRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

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
        private readonly CsvAnalysisStore $analysisStore,
        private readonly LichessImportCriteriaFactory $criteriaFactory,
    ) {}

    #[
        Route(
            '/api/trainings/{id}/imports/csv/analyze',
            name: 'api_training_csv_import_analyze',
            methods: ['POST'],
        ),
    ]
    public function analyzeCsv(int $id, Request $request): JsonResponse
    {
        $training = $this->trainingForCurrentUser($id);
        $analysis = $this->csvAnalysisService->prepareForTraining(
            $training,
            $this->csvPuzzleParser->parseUpload($request->files->get('file')),
        );
        $analysisId = bin2hex(random_bytes(16));
        $this->analysisStore->save($id . '-' . $analysisId, $analysis);
        return new JsonResponse([
            'analysisId' => $analysisId,
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
            'preview' => array_map(
                static fn(array $row): array => [
                    'rating' => (int) ($row['rating'] ?? 0),
                    'themes' => is_array($row['themes'] ?? null) ? array_values($row['themes']) : [],
                ],
                array_slice(
                    array_values(
                        array_filter(
                            $analysis['rows'],
                            static fn(array $row): bool => ($row['status'] ?? null) === 'valid',
                        ),
                    ),
                    0,
                    20,
                ),
            ),
        ]);
    }

    #[Route('/api/trainings/{id}/imports/csv', name: 'api_training_csv_import', methods: ['POST'])]
    public function importCsv(int $id, Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $training = $this->trainingForCurrentUser($id);
        $analysisId = trim((string) $request->request->get('analysisId'));
        if ('' === $analysisId) {
            throw new BadRequestHttpException('Analyse CSV expirée. Analysez à nouveau le fichier.');
        }
        $analysis = $this->analysisStore->get($id . '-' . $analysisId);
        if (!is_array($analysis)) {
            throw new BadRequestHttpException('Analyse CSV expirée. Analysez à nouveau le fichier.');
        }
        $skipDuplicates = $this->requestBoolean($request->request->get('skipDuplicates'), true);
        $skipErroredPuzzles = $this->requestBoolean($request->request->get('skipErroredPuzzles'), true);
        if ([] !== $analysis['errors'] && !$skipErroredPuzzles) {
            throw new PuzzleImportValidationException($analysis['errors']);
        }

        $puzzles = $this->csvAnalysisService->puzzlesForImport($analysis, $skipDuplicates);
        return new JsonResponse($this->importService->import($user, $training, $puzzles, 'csv', false), 201);
    }

    #[
        Route(
            '/api/trainings/{id}/imports/lichess/options',
            name: 'api_training_lichess_import_options',
            methods: ['GET'],
        ),
    ]
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

    #[
        Route(
            '/api/trainings/{id}/imports/lichess/availability',
            name: 'api_training_lichess_import_availability',
            methods: ['POST'],
        ),
    ]
    public function lichessAvailability(int $id, Request $request): JsonResponse
    {
        $this->trainingForCurrentUser($id);

        if (!$this->lichessDatasetProvider->isConfigured()) {
            return new JsonResponse(['availableCount' => null]);
        }

        return new JsonResponse([
            'availableCount' => $this->lichessDatasetProvider->count(
                $this->criteriaFactory->fromJson($request->getContent()),
            ),
        ]);
    }

    #[Route('/api/trainings/{id}/imports/lichess', name: 'api_training_lichess_import', methods: ['POST'])]
    public function importLichess(int $id, Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $training = $this->trainingForCurrentUser($id);
        $puzzles = $this->lichessDatasetProvider->select(
            $this->criteriaFactory->fromJson($request->getContent()),
        );

        return new JsonResponse($this->importService->import($user, $training, $puzzles, 'lichess'), 201);
    }

    private function requestBoolean(mixed $value, bool $default): bool
    {
        if (null === $value || '' === $value) {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    private function currentUser(): User
    {
        $user = $this->security->getUser();
        if (!($user instanceof User)) {
            throw new NotFoundHttpException();
        }
        return $user;
    }

    private function trainingForCurrentUser(int $id): Training
    {
        $training = $this->trainingRepository->findOneOwnedByUser($id, $this->currentUser());
        if (!($training instanceof Training)) {
            throw new NotFoundHttpException();
        }
        return $training;
    }
}
