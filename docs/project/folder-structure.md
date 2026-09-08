# Arborescence expliquée

## Backend

### `backend/src/Entity`
Entités Doctrine, c'est-à-dire objets PHP persistés en base.

- `backend/src/Entity/Attempt.php`
- `backend/src/Entity/AuthenticationEvent.php`
- `backend/src/Entity/Cycle.php`
- `backend/src/Entity/CyclePuzzle.php`
- `backend/src/Entity/Puzzle.php`
- `backend/src/Entity/Training.php`
- `backend/src/Entity/TrainingPuzzle.php`
- `backend/src/Entity/TrainingSession.php`
- `backend/src/Entity/User.php`
- `backend/src/Entity/UserPreference.php`

### `backend/src/Controller`
Actions HTTP spécifiques, principalement endpoints agrégés/import/settings.

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `AuthLogoutAction` | `backend/src/Controller/AuthLogoutAction.php` | `__construct()`, `__invoke()` |
| `HistoryOverviewAction` | `backend/src/Controller/HistoryOverviewAction.php` | `__construct()`, `__invoke()` |
| `StatsOverviewAction` | `backend/src/Controller/StatsOverviewAction.php` | `__construct()`, `__invoke()` |
| `TrainingAnalyticsAction` | `backend/src/Controller/TrainingAnalyticsAction.php` | `__construct()`, `__invoke()` |
| `TrainingAttemptHistoryAction` | `backend/src/Controller/TrainingAttemptHistoryAction.php` | `__construct()`, `__invoke()` |
| `TrainingCycleHistoryAction` | `backend/src/Controller/TrainingCycleHistoryAction.php` | `__construct()`, `__invoke()` |
| `TrainingDashboardAction` | `backend/src/Controller/TrainingDashboardAction.php` | `__construct()`, `__invoke()` |
| `TrainingOverviewAction` | `backend/src/Controller/TrainingOverviewAction.php` | `__construct()`, `__invoke()` |
| `TrainingPuzzleImportAction` | `backend/src/Controller/TrainingPuzzleImportAction.php` | `__construct()`, `analyzeCsv()`, `importCsv()`, `lichessOptions()`, `lichessAvailability()`, `importLichess()` |
| `TrainingSummaryAction` | `backend/src/Controller/TrainingSummaryAction.php` | `__construct()`, `__invoke()` |
| `UserAvatarUploadAction` | `backend/src/Controller/UserAvatarUploadAction.php` | `__construct()`, `__invoke()` |
| `UserDeleteAction` | `backend/src/Controller/UserDeleteAction.php` | `__construct()`, `__invoke()` |
| `UserEmailUpdateAction` | `backend/src/Controller/UserEmailUpdateAction.php` | `__construct()`, `__invoke()` |
| `UserPasswordUpdateAction` | `backend/src/Controller/UserPasswordUpdateAction.php` | `__construct()`, `__invoke()` |
| `UserSettingsOverviewAction` | `backend/src/Controller/UserSettingsOverviewAction.php` | `__construct()`, `__invoke()` |
| `UserSettingsUpdateAction` | `backend/src/Controller/UserSettingsUpdateAction.php` | `__construct()`, `__invoke()` |

### `backend/src/ReadModel`
Readers orientés écrans. Ils produisent des structures JSON directement exploitables.

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `HistoryOverviewReader` | `backend/src/ReadModel/HistoryOverviewReader.php` | `__construct()`, `build()` |
| `StatsOverviewReader` | `backend/src/ReadModel/StatsOverviewReader.php` | `__construct()`, `build()` |
| `TrainingAnalyticsReader` | `backend/src/ReadModel/TrainingAnalyticsReader.php` | `__construct()`, `build()` |
| `TrainingAttemptHistoryReader` | `backend/src/ReadModel/TrainingAttemptHistoryReader.php` | `__construct()`, `build()` |
| `TrainingCycleHistoryReader` | `backend/src/ReadModel/TrainingCycleHistoryReader.php` | `__construct()`, `build()` |
| `TrainingOverviewReader` | `backend/src/ReadModel/TrainingOverviewReader.php` | `__construct()`, `build()` |
| `TrainingSummaryReader` | `backend/src/ReadModel/TrainingSummaryReader.php` | `__construct()`, `build()` |

### `backend/src/Service`
Services métier réutilisables.

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `AuthenticationEventRecorder` | `backend/src/Service/AuthenticationEventRecorder.php` | `__construct()`, `record()` |
| `CycleCompletionService` | `backend/src/Service/CycleCompletionService.php` | `__construct()`, `synchronizeCyclePuzzleState()` |
| `SolverAttemptLifecycleService` | `backend/src/Service/SolverAttemptLifecycleService.php` | `__construct()`, `persistAttempt()` |
| `UserPreferenceManager` | `backend/src/Service/UserPreferenceManager.php` | `__construct()`, `getOrCreate()` |

### `backend/src/State`
Processors API Platform qui entourent la persistance standard.

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `OwnedTrainingResourceProcessor` | `backend/src/State/OwnedTrainingResourceProcessor.php` | `__construct()`, `process()` |
| `TrainingOwnerProcessor` | `backend/src/State/TrainingOwnerProcessor.php` | `__construct()`, `process()` |
| `UserPasswordHasherProcessor` | `backend/src/State/UserPasswordHasherProcessor.php` | `__construct()`, `process()` |

### `backend/src/Import`
Pipeline CSV/Lichess.

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `CsvAnalysisStore` | `backend/src/Import/CsvAnalysisStore.php` | `__construct()`, `save()`, `get()` |
| `CsvPuzzleParser` | `backend/src/Import/CsvPuzzleParser.php` | `parseUpload()`, `normalizeRecord()` |
| `LichessDatasetProvider` | `backend/src/Import/LichessDatasetProvider.php` | `__construct()`, `filterOptions()`, `isConfigured()`, `count()`, `select()` |
| `LichessImportCriteriaFactory` | `backend/src/Import/LichessImportCriteriaFactory.php` | `fromJson()` |
| `NormalizedPuzzle` | `backend/src/Import/NormalizedPuzzle.php` | `__construct()`, `fingerprint()` |
| `PuzzleImportValidationException` | `backend/src/Import/PuzzleImportValidationException.php` | `__construct()` |
| `TrainingCsvAnalysisService` | `backend/src/Import/TrainingCsvAnalysisService.php` | `prepareForTraining()`, `puzzlesForImport()` |
| `TrainingPuzzleImportService` | `backend/src/Import/TrainingPuzzleImportService.php` | `__construct()`, `import()` |

### `backend/src/Repository`
Requêtes Doctrine spécialisées.

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `AttemptRepository` | `backend/src/Repository/AttemptRepository.php` | `__construct()`, `hasSuccessfulAttemptForCyclePuzzle()`, `hasSolvedAttemptForCyclePuzzle()`, `hasFailedAttemptForCyclePuzzle()`, `findActiveAttemptForCyclePuzzle()`, `countCompletedAttemptsForCyclePuzzle()`, `sumDurationsForCyclePuzzle()`, `getNextAttemptNumberForCyclePuzzle()`, `findLatestCompletedAtForCyclePuzzle()`, `findOneByClientRequestId()`, `findByTrainingOrdered()` |
| `AuthenticationEventRepository` | `backend/src/Repository/AuthenticationEventRepository.php` | `__construct()`, `findByUserOrdered()`, `findOneByTokenFingerprint()`, `findLatestByUserAndType()` |
| `CyclePuzzleRepository` | `backend/src/Repository/CyclePuzzleRepository.php` | `__construct()`, `hasIncompleteCyclePuzzleForCycle()`, `findByTrainingOrdered()` |
| `CycleRepository` | `backend/src/Repository/CycleRepository.php` | `__construct()`, `hasActiveCycleForTraining()`, `hasCycleForTraining()`, `findByTrainingOrdered()` |
| `PuzzleRepository` | `backend/src/Repository/PuzzleRepository.php` | `__construct()` |
| `TrainingPuzzleRepository` | `backend/src/Repository/TrainingPuzzleRepository.php` | `__construct()`, `findByTrainingWithPuzzleOrdered()` |
| `TrainingRepository` | `backend/src/Repository/TrainingRepository.php` | `__construct()`, `findOneOwnedByUser()`, `findOwnedByUserOrdered()` |
| `TrainingSessionRepository` | `backend/src/Repository/TrainingSessionRepository.php` | `__construct()`, `findByTrainingOrdered()` |
| `UserPreferenceRepository` | `backend/src/Repository/UserPreferenceRepository.php` | `__construct()`, `findOneByUser()` |
| `UserRepository` | `backend/src/Repository/UserRepository.php` | `__construct()`, `upgradePassword()` |

### `backend/migrations`
Historique du schéma SQL, à ne pas réécrire arbitrairement après publication.

## Frontend

### `frontend/src/app`
Bootstrap, layout, navigation, routeur, error boundary.

### `frontend/src/features`
Organisation verticale par fonctionnalité :
- auth ;
- dashboard ;
- history ;
- import ;
- settings ;
- solver ;
- statistics ;
- trainings.

### `frontend/src/shared`
Infrastructure transversale :
- client API ;
- composants UI ;
- notifications ;
- icônes.

### `frontend/src/styles/tokens`
Design tokens : couleurs, radius, spacing, typographie.

## Infrastructure

- `compose.yaml` : dev ;
- `compose.e2e.yaml` : E2E ;
- `docker/php` : PHP-FPM + entrypoint ;
- `docker/frontend` : Node/Vite ;
- `docker/nginx` : reverse proxy ;
- `docker/e2e` : runner Playwright.

## Documentation

Le dossier `docs/` constitue la source de vérité documentaire. Les documents de travail obsolètes ne font pas partie du dépôt public.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
