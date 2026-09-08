# Architecture frontend

## Point d'entrée

`frontend/src/main.tsx` crée l'application React et fournit notamment TanStack Query.

`frontend/src/app/App.tsx` :
- charge la session stockée ;
- applique thème/langue ;
- gère le routeur ;
- écoute les `401` ;
- bascule entre Auth et `TrainingsPanelView`.

## Organisation par features

### Auth
- `frontend/src/features/auth/components/AuthPanel.test.tsx`
- `frontend/src/features/auth/components/AuthPanel.tsx`
- `frontend/src/features/auth/components/AuthScreen.tsx`
- `frontend/src/features/auth/pages/AuthPage.tsx`
- `frontend/src/features/auth/services/authStorage.ts`
- `frontend/src/features/auth/styles/auth.css`

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

## Pourquoi feature folders ?

Un découpage uniquement `components/hooks/services` à la racine oblige à chercher une feature dans de nombreux dossiers. Ici, chaque domaine possède ses composants/hooks/types/styles, tandis que `shared/` garde uniquement le réellement transversal.

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

- `frontend/src/app/routing/appRouter.test.ts`
- `frontend/src/features/auth/components/AuthPanel.test.tsx`
- `frontend/src/features/history/pages/HistoryView.test.tsx`
- `frontend/src/features/import/csv/csvImport.test.ts`
- `frontend/src/features/import/hooks/useImportActions.test.tsx`
- `frontend/src/features/import/hooks/useImportViewState.test.tsx`
- `frontend/src/features/import/pages/ImportView.test.tsx`
- `frontend/src/features/settings/pages/SettingsView.test.tsx`
- `frontend/src/features/solver/components/PuzzleSolver.test.tsx`
- `frontend/src/features/solver/domain/puzzleValidation.test.ts`
- `frontend/src/features/solver/pages/SolverView.test.tsx`
- `frontend/src/features/statistics/pages/StatisticsView.test.tsx`
- `frontend/src/features/trainings/components/identity/TrainingIconCustomizer.test.tsx`
- `frontend/src/features/trainings/hooks/useTrainingsPanelRouting.test.tsx`
- `frontend/src/features/trainings/pages/create/TrainingsCreateView.test.tsx`
- `frontend/src/features/trainings/pages/detail/TrainingsDetailView.test.tsx`
- `frontend/src/features/trainings/pages/edit/TrainingsEditView.test.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContentScreen.test.tsx`
- `frontend/src/features/trainings/state/TrainingsQueryState.test.tsx`
- `frontend/src/shared/api/client.test.ts`
- `frontend/src/shared/ui/LoadingButton.test.tsx`
- `frontend/src/shared/ui/Modal.test.tsx`
- `frontend/src/shared/ui/StatePanel.test.tsx`
