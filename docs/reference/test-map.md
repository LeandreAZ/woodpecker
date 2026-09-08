# Référence — carte des tests

## Backend (30 fichiers)

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

## Frontend (23 fichiers)

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

## Playwright (9 specs)

- `frontend/e2e/auth.spec.ts`
- `frontend/e2e/chessboard.spec.ts`
- `frontend/e2e/import.spec.ts`
- `frontend/e2e/mobile.spec.ts`
- `frontend/e2e/permissions.spec.ts`
- `frontend/e2e/routing-errors.spec.ts`
- `frontend/e2e/settings.spec.ts`
- `frontend/e2e/solver.spec.ts`
- `frontend/e2e/training.spec.ts`

Cette carte permet de choisir rapidement la suite ciblée après une modification. Elle ne remplace pas `docs/testing/`, qui explique la stratégie et l'environnement.
