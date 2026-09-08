# Backend Symfony

## Responsabilités

Le backend est la frontière de confiance :
- authentifier ;
- valider ;
- appliquer ownership ;
- persister ;
- protéger les invariants ;
- calculer les agrégats fiables ;
- gérer les imports.

## Principales couches

### Entités
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

### Services
| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `AuthenticationEventRecorder` | `backend/src/Service/AuthenticationEventRecorder.php` | `__construct()`, `record()` |
| `CycleCompletionService` | `backend/src/Service/CycleCompletionService.php` | `__construct()`, `synchronizeCyclePuzzleState()` |
| `SolverAttemptLifecycleService` | `backend/src/Service/SolverAttemptLifecycleService.php` | `__construct()`, `persistAttempt()` |
| `UserPreferenceManager` | `backend/src/Service/UserPreferenceManager.php` | `__construct()`, `getOrCreate()` |

### ReadModels
| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `HistoryOverviewReader` | `backend/src/ReadModel/HistoryOverviewReader.php` | `__construct()`, `build()` |
| `StatsOverviewReader` | `backend/src/ReadModel/StatsOverviewReader.php` | `__construct()`, `build()` |
| `TrainingAnalyticsReader` | `backend/src/ReadModel/TrainingAnalyticsReader.php` | `__construct()`, `build()` |
| `TrainingAttemptHistoryReader` | `backend/src/ReadModel/TrainingAttemptHistoryReader.php` | `__construct()`, `build()` |
| `TrainingCycleHistoryReader` | `backend/src/ReadModel/TrainingCycleHistoryReader.php` | `__construct()`, `build()` |
| `TrainingOverviewReader` | `backend/src/ReadModel/TrainingOverviewReader.php` | `__construct()`, `build()` |
| `TrainingSummaryReader` | `backend/src/ReadModel/TrainingSummaryReader.php` | `__construct()`, `build()` |

### Processors
| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `OwnedTrainingResourceProcessor` | `backend/src/State/OwnedTrainingResourceProcessor.php` | `__construct()`, `process()` |
| `TrainingOwnerProcessor` | `backend/src/State/TrainingOwnerProcessor.php` | `__construct()`, `process()` |
| `UserPasswordHasherProcessor` | `backend/src/State/UserPasswordHasherProcessor.php` | `__construct()`, `process()` |

### Repositories
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

## Injection de dépendances

`backend/config/services.yaml` active `autowire` et `autoconfigure` pour `App\`. Les constructeurs déclarent leurs dépendances, Symfony récupère les services compatibles dans le container.

Ce mécanisme évite les `new Repository()` ou `new EntityManager()` dispersés dans le code et facilite les tests/remplacements.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.

## Tests directement associés

- `backend/tests/Command/E2eResetCommandTest.php`
- `backend/tests/Controller/AuthLogoutActionTest.php`
- `backend/tests/Controller/HistoryOverviewActionTest.php`
- `backend/tests/Controller/StatsOverviewActionTest.php`
- `backend/tests/Controller/TrainingAnalyticsActionTest.php`
- `backend/tests/Controller/TrainingAttemptHistoryActionTest.php`
- `backend/tests/Controller/TrainingCycleHistoryActionTest.php`
- `backend/tests/Controller/TrainingDashboardActionTest.php`
- `backend/tests/Controller/TrainingOverviewActionTest.php`
- `backend/tests/Controller/TrainingPuzzleImportActionTest.php`
- `backend/tests/Controller/TrainingSummaryActionTest.php`
- `backend/tests/Controller/UserAvatarUploadActionTest.php`
- `backend/tests/Controller/UserDeleteActionTest.php`
- `backend/tests/Controller/UserEmailUpdateActionTest.php`
- `backend/tests/Controller/UserHttpSecurityTest.php`
- `backend/tests/Controller/UserPasswordUpdateActionTest.php`
- `backend/tests/Controller/UserSettingsOverviewActionTest.php`
- `backend/tests/Controller/UserSettingsUpdateActionTest.php`
- `backend/tests/Entity/UserTest.php`
- `backend/tests/EventSubscriber/AuthenticationEventSubscriberTest.php`
- `backend/tests/EventSubscriber/AuthenticationTokenExpiredSubscriberTest.php`
- `backend/tests/Import/LichessDatasetProviderTest.php`
- `backend/tests/Import/LichessImportCriteriaFactoryTest.php`
- `backend/tests/Import/TrainingCsvAnalysisServiceTest.php`
- `backend/tests/Security/TrainingOwnershipCheckerTest.php`
- `backend/tests/Service/AuthenticationEventRecorderTest.php`
- `backend/tests/Service/CycleCompletionServiceTest.php`
- `backend/tests/Service/SolverAttemptLifecycleServiceTest.php`
- `backend/tests/State/OwnedTrainingResourceProcessorTest.php`
- `backend/tests/bootstrap.php`
