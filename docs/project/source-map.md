# Carte des sources

Ce document sert de mémo de navigation.

## Classes backend par couche

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

### Import
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

### State
| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `OwnedTrainingResourceProcessor` | `backend/src/State/OwnedTrainingResourceProcessor.php` | `__construct()`, `process()` |
| `TrainingOwnerProcessor` | `backend/src/State/TrainingOwnerProcessor.php` | `__construct()`, `process()` |
| `UserPasswordHasherProcessor` | `backend/src/State/UserPasswordHasherProcessor.php` | `__construct()`, `process()` |

### Security / Doctrine
| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `TrainingOwnershipChecker` | `backend/src/Security/TrainingOwnershipChecker.php` | `isOwnedByCurrentUser()` |

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `CurrentUserTrainingScopeExtension` | `backend/src/Doctrine/CurrentUserTrainingScopeExtension.php` | `__construct()`, `applyToCollection()`, `applyToItem()` |

### Commands
| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `E2eResetCommand` | `backend/src/Command/E2eResetCommand.php` | `__construct()` |
| `LichessCatalogSyncCommand` | `backend/src/Command/LichessCatalogSyncCommand.php` | `__construct()` |

## Fichiers frontend par feature

### Solver
- `frontend/src/features/solver/components/PuzzleSolver.test.tsx`
- `frontend/src/features/solver/components/PuzzleSolver.tsx`
- `frontend/src/features/solver/components/SolverControls.tsx`
- `frontend/src/features/solver/components/SolverProgress.tsx`
- `frontend/src/features/solver/components/SolverPuzzleList.tsx`
- `frontend/src/features/solver/components/SolverSummary.tsx`
- `frontend/src/features/solver/domain/puzzleValidation.test.ts`
- `frontend/src/features/solver/domain/puzzleValidation.ts`
- `frontend/src/features/solver/domain/solverViewModel.ts`
- `frontend/src/features/solver/hooks/useSolverActions.ts`
- `frontend/src/features/solver/pages/SolverView.test.tsx`
- `frontend/src/features/solver/pages/SolverView.tsx`
- `frontend/src/features/solver/services/chessboardPreferences.ts`
- `frontend/src/features/solver/services/solverPersistence.ts`
- `frontend/src/features/solver/styles/puzzle-solver.css`
- `frontend/src/features/solver/styles/solver.css`
- `frontend/src/features/solver/types/solver.types.ts`
- `frontend/src/features/solver/types/solverView.types.ts`
- `frontend/src/features/solver/utils/solverFormatting.ts`

### Trainings
- `frontend/src/features/trainings/actions/actionTypes.ts`
- `frontend/src/features/trainings/actions/useCycleActions.ts`
- `frontend/src/features/trainings/actions/useTrainingActions.ts`
- `frontend/src/features/trainings/actions/useTrainingPuzzleActions.ts`
- `frontend/src/features/trainings/components/detail/DetailCollection.tsx`
- `frontend/src/features/trainings/components/detail/DetailCycles.tsx`
- `frontend/src/features/trainings/components/detail/DetailHeader.tsx`
- `frontend/src/features/trainings/components/detail/DetailSummary.tsx`
- `frontend/src/features/trainings/components/identity/TrainingBranding.tsx`
- `frontend/src/features/trainings/components/identity/TrainingIconCustomizer.test.tsx`
- `frontend/src/features/trainings/components/identity/TrainingIconCustomizer.tsx`
- `frontend/src/features/trainings/components/identity/TrainingIdentityFormView.tsx`
- `frontend/src/features/trainings/components/primitives/TrainingsViewPrimitives.tsx`
- `frontend/src/features/trainings/hooks/useTrainingsPanelActions.ts`
- `frontend/src/features/trainings/hooks/useTrainingsPanelQueries.ts`
- `frontend/src/features/trainings/hooks/useTrainingsPanelRouting.test.tsx`
- `frontend/src/features/trainings/hooks/useTrainingsPanelRouting.ts`
- `frontend/src/features/trainings/hooks/useTrainingsPanelUiState.ts`
- `frontend/src/features/trainings/mocks/previewData.ts`
- `frontend/src/features/trainings/models/detailModel.ts`
- `frontend/src/features/trainings/pages/create/TrainingsCreateView.test.tsx`
- `frontend/src/features/trainings/pages/create/TrainingsCreateView.tsx`
- `frontend/src/features/trainings/pages/detail/TrainingsDetailView.test.tsx`
- `frontend/src/features/trainings/pages/detail/TrainingsDetailView.tsx`
- `frontend/src/features/trainings/pages/edit/TrainingsEditView.test.tsx`
- `frontend/src/features/trainings/pages/edit/TrainingsEditView.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanel.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContent.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContentScreen.test.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContentScreen.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContentViews.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelView.tsx`
- `frontend/src/features/trainings/state/TrainingsQueryState.test.tsx`
- `frontend/src/features/trainings/state/TrainingsQueryState.tsx`
- `frontend/src/features/trainings/state/useTrainingsPanelState.ts`
- `frontend/src/features/trainings/styles/detail/detail-collection-refinements.css`
- `frontend/src/features/trainings/styles/detail/detail-collection.css`
- `frontend/src/features/trainings/styles/detail/detail-cycle-refinements.css`
- `frontend/src/features/trainings/styles/detail/detail-cycles.css`
- `frontend/src/features/trainings/styles/detail/detail-layout.css`
- `frontend/src/features/trainings/styles/detail/detail-modals.css`
- `frontend/src/features/trainings/styles/detail/detail-responsive.css`
- `frontend/src/features/trainings/styles/detail/detail-summary.css`
- `frontend/src/features/trainings/styles/detail/detail.css`
- `frontend/src/features/trainings/styles/identity/training-branding.css`
- `frontend/src/features/trainings/styles/identity/training-form.css`
- `frontend/src/features/trainings/styles/identity/training-icon-customizer.css`
- `frontend/src/features/trainings/styles/identity/training-identity-form.css`
- `frontend/src/features/trainings/styles/panel/panel-layout.css`
- `frontend/src/features/trainings/styles/trainings-common.css`
- `frontend/src/features/trainings/types/detail.types.ts`
- `frontend/src/features/trainings/types/training.types.ts`
- `frontend/src/features/trainings/utils/training.utils.ts`

### Import
- `frontend/src/features/import/csv/CsvAnalysisReview.tsx`
- `frontend/src/features/import/csv/CsvImportWizard.tsx`
- `frontend/src/features/import/csv/csvImport.test.ts`
- `frontend/src/features/import/csv/csvImport.ts`
- `frontend/src/features/import/csv/csvImport.types.ts`
- `frontend/src/features/import/hooks/useImportActions.test.tsx`
- `frontend/src/features/import/hooks/useImportActions.ts`
- `frontend/src/features/import/hooks/useImportViewState.test.tsx`
- `frontend/src/features/import/hooks/useImportViewState.ts`
- `frontend/src/features/import/lichess/LichessImportForm.tsx`
- `frontend/src/features/import/lichess/lichessImport.types.ts`
- `frontend/src/features/import/lichess/lichessThemes.ts`
- `frontend/src/features/import/pages/ImportView.test.tsx`
- `frontend/src/features/import/pages/ImportView.tsx`
- `frontend/src/features/import/styles/csv-import.css`
- `frontend/src/features/import/styles/csv-layout-overrides.css`
- `frontend/src/features/import/styles/csv-review.css`
- `frontend/src/features/import/styles/csv-selection.css`
- `frontend/src/features/import/styles/csv-wizard.css`
- `frontend/src/features/import/styles/import-layout.css`
- `frontend/src/features/import/styles/import-refinements.css`
- `frontend/src/features/import/styles/import.css`
- `frontend/src/features/import/styles/lichess-import.css`
- `frontend/src/features/import/utils/importFormatting.ts`

### History
- `frontend/src/features/history/components/HistoryFilters.tsx`
- `frontend/src/features/history/components/HistoryPagination.tsx`
- `frontend/src/features/history/components/HistoryStatusBadge.tsx`
- `frontend/src/features/history/components/HistoryTable.tsx`
- `frontend/src/features/history/components/HistoryTimeline.tsx`
- `frontend/src/features/history/hooks/useHistoryOverviewQuery.ts`
- `frontend/src/features/history/pages/HistoryView.test.tsx`
- `frontend/src/features/history/pages/HistoryView.tsx`
- `frontend/src/features/history/styles/history.css`
- `frontend/src/features/history/types/history.types.ts`
- `frontend/src/features/history/types/historyView.types.ts`
- `frontend/src/features/history/utils/historyFilters.ts`
- `frontend/src/features/history/utils/historyFormatting.ts`

### Statistics
- `frontend/src/features/statistics/components/AttemptDistribution.tsx`
- `frontend/src/features/statistics/components/ChartEmpty.tsx`
- `frontend/src/features/statistics/components/CycleResultsChart.tsx`
- `frontend/src/features/statistics/components/DistributionDonut.tsx`
- `frontend/src/features/statistics/components/DistributionLegend.tsx`
- `frontend/src/features/statistics/components/GenericLineChart.tsx`
- `frontend/src/features/statistics/components/ResultDistribution.tsx`
- `frontend/src/features/statistics/components/StatisticsFilterIcons.tsx`
- `frontend/src/features/statistics/components/StatisticsSummary.tsx`
- `frontend/src/features/statistics/components/TimeDistribution.tsx`
- `frontend/src/features/statistics/components/TrainingCell.tsx`
- `frontend/src/features/statistics/hooks/useStatsOverviewQuery.ts`
- `frontend/src/features/statistics/pages/StatisticsView.test.tsx`
- `frontend/src/features/statistics/pages/StatisticsView.tsx`
- `frontend/src/features/statistics/styles/charts.css`
- `frontend/src/features/statistics/styles/cycle-results.css`
- `frontend/src/features/statistics/styles/distributions.css`
- `frontend/src/features/statistics/styles/global-charts.css`
- `frontend/src/features/statistics/styles/global-layout.css`
- `frontend/src/features/statistics/styles/global-panels.css`
- `frontend/src/features/statistics/styles/global-responsive.css`
- `frontend/src/features/statistics/styles/statistics-layout.css`
- `frontend/src/features/statistics/styles/statistics-page.css`
- `frontend/src/features/statistics/styles/statistics-responsive.css`
- `frontend/src/features/statistics/styles/statistics-v2-charts.css`
- `frontend/src/features/statistics/styles/statistics-v2-distributions.css`
- `frontend/src/features/statistics/styles/statistics-v2-layout.css`
- `frontend/src/features/statistics/styles/statistics-v2-responsive.css`
- `frontend/src/features/statistics/styles/statistics.css`
- `frontend/src/features/statistics/types/statistics.types.ts`
- `frontend/src/features/statistics/types/statisticsView.types.ts`
- `frontend/src/features/statistics/utils/statisticsFormatting.ts`
- `frontend/src/features/statistics/utils/statisticsModel.ts`

### Settings
- `frontend/src/features/settings/components/AppearanceSettingsSection.tsx`
- `frontend/src/features/settings/components/BoardSettingsSection.tsx`
- `frontend/src/features/settings/components/InteractiveBoardPreview.tsx`
- `frontend/src/features/settings/components/LanguagePicker.tsx`
- `frontend/src/features/settings/components/ProfileSettingsSection.tsx`
- `frontend/src/features/settings/components/SettingsModalShell.tsx`
- `frontend/src/features/settings/components/SolverSettingsSection.tsx`
- `frontend/src/features/settings/hooks/useSettingsActions.ts`
- `frontend/src/features/settings/hooks/useUserSettingsOverviewQuery.ts`
- `frontend/src/features/settings/pages/SettingsView.test.tsx`
- `frontend/src/features/settings/pages/SettingsView.tsx`
- `frontend/src/features/settings/styles/settings.css`
- `frontend/src/features/settings/types/settings.types.ts`
- `frontend/src/features/settings/types/settingsView.types.ts`
- `frontend/src/features/settings/utils/settingsDraft.ts`
