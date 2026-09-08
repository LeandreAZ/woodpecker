# Référence — fichiers frontend

Index des fichiers TypeScript/TSX de la v1. Le but n'est pas de remplacer l'explication par feature mais de fournir une carte exhaustive.

## `App.tsx`
- `frontend/src/app/App.tsx`

## `config`
- `frontend/src/app/config/brand.ts`

## `errors`
- `frontend/src/app/errors/AppErrorBoundary.tsx`

## `layout`
- `frontend/src/app/layout/navigation/AppNavigation.tsx`
- `frontend/src/app/layout/trainings/TrainingsAppShell.tsx`

## `routing`
- `frontend/src/app/routing/appRouter.test.ts`
- `frontend/src/app/routing/appRouter.ts`

## `auth`
- `frontend/src/features/auth/components/AuthPanel.test.tsx`
- `frontend/src/features/auth/components/AuthPanel.tsx`
- `frontend/src/features/auth/components/AuthScreen.tsx`
- `frontend/src/features/auth/pages/AuthPage.tsx`
- `frontend/src/features/auth/services/authStorage.ts`

## `dashboard`
- `frontend/src/features/dashboard/pages/DashboardOverviewView.tsx`

## `history`
- `frontend/src/features/history/components/HistoryFilters.tsx`
- `frontend/src/features/history/components/HistoryPagination.tsx`
- `frontend/src/features/history/components/HistoryStatusBadge.tsx`
- `frontend/src/features/history/components/HistoryTable.tsx`
- `frontend/src/features/history/components/HistoryTimeline.tsx`
- `frontend/src/features/history/hooks/useHistoryOverviewQuery.ts`
- `frontend/src/features/history/pages/HistoryView.test.tsx`
- `frontend/src/features/history/pages/HistoryView.tsx`
- `frontend/src/features/history/types/history.types.ts`
- `frontend/src/features/history/types/historyView.types.ts`
- `frontend/src/features/history/utils/historyFilters.ts`
- `frontend/src/features/history/utils/historyFormatting.ts`

## `import`
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
- `frontend/src/features/import/utils/importFormatting.ts`

## `settings`
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
- `frontend/src/features/settings/types/settings.types.ts`
- `frontend/src/features/settings/types/settingsView.types.ts`
- `frontend/src/features/settings/utils/settingsDraft.ts`

## `solver`
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
- `frontend/src/features/solver/types/solver.types.ts`
- `frontend/src/features/solver/types/solverView.types.ts`
- `frontend/src/features/solver/utils/solverFormatting.ts`

## `statistics`
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
- `frontend/src/features/statistics/types/statistics.types.ts`
- `frontend/src/features/statistics/types/statisticsView.types.ts`
- `frontend/src/features/statistics/utils/statisticsFormatting.ts`
- `frontend/src/features/statistics/utils/statisticsModel.ts`

## `trainings`
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
- `frontend/src/features/trainings/types/detail.types.ts`
- `frontend/src/features/trainings/types/training.types.ts`
- `frontend/src/features/trainings/utils/training.utils.ts`

## `root`
- `frontend/src/main.tsx`
- `frontend/src/vite-env.d.ts`

## `api`
- `frontend/src/shared/api/client.test.ts`
- `frontend/src/shared/api/client.ts`

## `icons`
- `frontend/src/shared/icons/AppIcons.tsx`

## `notifications`
- `frontend/src/shared/notifications/notifications.ts`

## `ui`
- `frontend/src/shared/ui/Badge.tsx`
- `frontend/src/shared/ui/Button.tsx`
- `frontend/src/shared/ui/Card.tsx`
- `frontend/src/shared/ui/ConfirmationModal.tsx`
- `frontend/src/shared/ui/EmptyState.tsx`
- `frontend/src/shared/ui/Input.tsx`
- `frontend/src/shared/ui/LoadingButton.test.tsx`
- `frontend/src/shared/ui/LoadingButton.tsx`
- `frontend/src/shared/ui/LoadingState.tsx`
- `frontend/src/shared/ui/Modal.test.tsx`
- `frontend/src/shared/ui/Modal.tsx`
- `frontend/src/shared/ui/Notifications.tsx`
- `frontend/src/shared/ui/PageSkeleton.tsx`
- `frontend/src/shared/ui/Select.tsx`
- `frontend/src/shared/ui/StatCard.tsx`
- `frontend/src/shared/ui/StatePanel.test.tsx`
- `frontend/src/shared/ui/StatePanel.tsx`
- `frontend/src/shared/ui/Textarea.tsx`
- `frontend/src/shared/ui/index.ts`

## `setup.ts`
- `frontend/src/test/setup.ts`
