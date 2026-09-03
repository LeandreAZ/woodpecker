import { useEffect, useRef } from 'react';
import type { CyclePuzzle, TrainingPuzzle, View } from './trainingsTypes';
import { DashboardOverviewView } from './dashboard/DashboardOverviewView';
import { DetailView } from './TrainingsDetailView';
import CreateTrainingView from './TrainingsCreateView';
import EditTrainingView from './TrainingsEditView';
import SolverView from './TrainingsSolverView';
import { TrainingsStatsView } from './TrainingsStatsView';
import type { useTrainingsPanelState } from './useTrainingsPanelState';
import './trainings-common.css';
import './detail.css';
import {
  HistoryOverviewView,
  ImportView,
  SettingsOverviewView,
} from './TrainingsPanelContentViews';
type TrainingsPanelState = ReturnType<typeof useTrainingsPanelState>;
type TrainingsPanelContentProps = {
  navigateToPuzzleSolver: (trainingPuzzleIri: string) => void;
  navigateToTraining: (trainingIri: string, view?: View) => void;
  navigateToView: (view: View) => void;
  state: TrainingsPanelState;
};
const emptyCyclePuzzles: CyclePuzzle[] = [];
const emptyTrainingPuzzles: TrainingPuzzle[] = [];
const emptySolverTrainingPuzzles: TrainingPuzzle[] = [];
export default function TrainingsPanelContentScreen({
  navigateToPuzzleSolver,
  navigateToTraining,
  navigateToView,
  state,
}: TrainingsPanelContentProps) {
  const {
    activeView,
    hydrateTrainingDraft,
    selectedTraining,
    trainingsQuery,
  } = state;
  const trainings = trainingsQuery.data ?? [];
  const hydratedEditTrainingIriRef = useRef<string | null>(null);
  const isEditLoading = activeView === 'edit' && !selectedTraining && (trainingsQuery.isLoading || trainingsQuery.isFetching);
  useEffect(() => {
    if (activeView !== 'edit') {
      hydratedEditTrainingIriRef.current = null;
      return;
    }
    if (!selectedTraining) {
      return;
    }
    if (hydratedEditTrainingIriRef.current === selectedTraining['@id']) {
      return;
    }
    hydrateTrainingDraft(selectedTraining);
    hydratedEditTrainingIriRef.current = selectedTraining['@id'];
  }, [activeView, hydrateTrainingDraft, selectedTraining]);
  return (
    <>
      <section className="wp-main">
      {state.activeView === 'dashboard' && (
        <DashboardOverviewView
          dashboardSummaries={state.dashboardSummariesQuery.data ?? []}
          errorMessage={state.dashboardSummariesQuery.error?.message ?? state.trainingsQuery.error?.message ?? state.statsOverviewQuery.error?.message}
          isError={state.dashboardSummariesQuery.isError || state.trainingsQuery.isError || state.statsOverviewQuery.isError}
          isSummariesLoading={state.dashboardSummariesQuery.isLoading || state.dashboardSummariesQuery.isFetching}
          isTrainingsLoading={state.trainingsQuery.isLoading || state.trainingsQuery.isFetching}
          onCreate={() => navigateToView('create')}
          onOpenTraining={navigateToTraining}
          selectedTrainingIri={state.selectedTrainingIri}
          statsOverview={state.statsOverviewQuery.data ?? null}
          trainings={trainings}
        />
      )}
      {state.activeView === 'create' && (
        <CreateTrainingView
          description={state.description}
          errorMessage={state.createTrainingMutation.error?.message}
          icon={state.icon}
          iconBackgroundColor={state.iconBackgroundColor}
          iconColor={state.iconColor}
          isError={state.createTrainingMutation.isError}
          isPending={state.createTrainingMutation.isPending}
          name={state.name}
          onDescriptionChange={state.setDescription}
          onIconBackgroundColorChange={state.setIconBackgroundColor}
          onIconChange={state.setIcon}
          onIconColorChange={state.setIconColor}
          onNameChange={state.setName}
          onResetDraft={state.resetTrainingDraft}
          onSubmit={() => state.createTrainingMutation.mutate()}
        />
      )}
      {state.activeView === 'edit' && (
        <EditTrainingView
          description={state.description}
          errorMessage={state.updateTrainingMutation.error?.message}
          icon={state.icon}
          iconBackgroundColor={state.iconBackgroundColor}
          iconColor={state.iconColor}
          isError={state.updateTrainingMutation.isError}
          isLoading={isEditLoading}
          isPending={state.updateTrainingMutation.isPending}
          name={state.name}
          onDescriptionChange={state.setDescription}
          onIconBackgroundColorChange={state.setIconBackgroundColor}
          onIconChange={state.setIcon}
          onIconColorChange={state.setIconColor}
          onNameChange={state.setName}
          onSubmit={() => state.updateTrainingMutation.mutate()}
        />
      )}
      {state.activeView === 'detail' && (
        <DetailView
          analytics={state.trainingAnalyticsQuery.data ?? null}
          analyticsError={state.trainingAnalyticsQuery.error?.message}
          analyticsIsError={state.trainingAnalyticsQuery.isError}
          analyticsIsLoading={state.trainingAnalyticsQuery.isLoading}
          createPuzzleMutation={state.createPuzzleMutation}
          currentCycle={state.currentCycle}
          cyclePuzzles={state.cyclePuzzlesQuery.data ?? emptyCyclePuzzles}
          cycleStats={state.cycleStats}
          cycleStatusLabel={state.currentCycleStatusLabel}
          deleteTrainingIsPending={state.deleteTrainingMutation.isPending}
          onDeleteTraining={() => {
            if (state.selectedTraining?.['@id']) {
              state.deleteTrainingMutation.mutate(state.selectedTraining['@id']);
            }
          }}
          deletePuzzleError={state.deleteTrainingPuzzleMutation.error?.message}
          deletePuzzleIsError={state.deleteTrainingPuzzleMutation.isError}
          deletePuzzleIsPending={state.deleteTrainingPuzzleMutation.isPending}
          fen={state.fen}
          hasResumableCycle={state.hasResumableCycle}
          movePuzzleError={state.moveTrainingPuzzleMutation.error?.message}
          movePuzzleIsError={state.moveTrainingPuzzleMutation.isError}
          movePuzzleIsPending={state.moveTrainingPuzzleMutation.isPending}
          onBackToDashboard={() => navigateToView('dashboard')}
          onEditTraining={() => navigateToView('edit')}
          onFenChange={state.setFen}
          onImport={() => navigateToView('import')}
          onOpenSolver={() => navigateToView('solver')}
          onPersonalNoteChange={state.setPersonalNote}
          onPuzzleDelete={(trainingPuzzleIri) => state.deleteTrainingPuzzleMutation.mutate(trainingPuzzleIri)}
          onPuzzleMove={(trainingPuzzleIri, direction) => state.moveTrainingPuzzleMutation.mutate({ direction, trainingPuzzleIri })}
          onPuzzleSelect={navigateToPuzzleSolver}
          onRatingChange={state.setRating}
          onViewAllAttemptHistory={() => {
            state.setHistoryFilterPreset({
              activity: 'attempt',
              training: state.selectedTraining?.['@id'] ?? 'all',
            });
            navigateToView('history');
          }}
          onSolutionTextChange={state.setSolutionText}
          onStartCycle={() => state.startCycleMutation.mutate()}
          onThemesTextChange={state.setThemesText}
          personalNote={state.personalNote}
          puzzleCount={state.selectedPuzzleCount}
          puzzleListIsLocked={state.puzzleListIsLocked}
          rating={state.rating}
          selectedTraining={state.selectedTraining}
          solutionText={state.solutionText}
          startCycleError={state.startCycleMutation.error?.message}
          startCycleIsError={state.startCycleMutation.isError}
          startCycleIsPending={state.startCycleMutation.isPending}
          summary={state.trainingSummaryQuery.data ?? null}
          summaryError={state.trainingSummaryQuery.error?.message}
          summaryIsError={state.trainingSummaryQuery.isError}
          summaryIsLoading={state.trainingSummaryQuery.isLoading}
          themesText={state.themesText}
          trainingPuzzles={state.trainingPuzzlesQuery.data ?? emptyTrainingPuzzles}
          trainingPuzzlesError={state.trainingPuzzlesQuery.error?.message}
          trainingPuzzlesIsError={state.trainingPuzzlesQuery.isError}
          trainingPuzzlesIsLoading={state.trainingPuzzlesQuery.isLoading}
        />
      )}
      {state.activeView === 'import' && (
        <ImportView
          csvErrorMessage={state.analyzeCsvMutation.error?.message ?? state.importCsvMutation.error?.message}
          isImportingCsv={state.importCsvMutation.isPending}
          isImportingLichess={state.importLichessMutation.isPending}
          lichessErrorMessage={state.importLichessMutation.error?.message}
          onAnalyzeCsv={async (file) => {
            state.setCsvFile(file);
            state.setCsvFileName(file.name);
            return state.analyzeCsvMutation.mutateAsync(file);
          }}
          onBackToTraining={() => navigateToView('detail')}
          onImportCsv={(options) => state.importCsvMutation.mutateAsync(options)}
          onEstimateLichessAvailability={state.estimateLichessAvailability}
          onImportLichess={(criteria) => state.importLichessMutation.mutate(criteria)}
          onSelectCsvFile={(file) => {
            state.setCsvFile(file);
            state.setCsvFileName(file?.name ?? '');
            state.setCsvRows([]);
            state.setCsvErrors([]);
          }}
          puzzleListIsLocked={state.puzzleListIsLocked}
          selectedTraining={state.selectedTraining}
        />
      )}
      {state.activeView === 'solver' && (
        <SolverView
          activeTrainingSessionIri={state.effectiveActiveTrainingSessionIri}
          attemptError={state.recordAttemptMutation.error?.message ?? state.saveCyclePuzzleProgressMutation.error?.message}
          attemptIsError={state.recordAttemptMutation.isError || state.saveCyclePuzzleProgressMutation.isError}
          attemptIsPending={state.recordAttemptMutation.isPending || state.saveCyclePuzzleProgressMutation.isPending}
          currentCyclePuzzle={state.selectedCyclePuzzle}
          currentCycle={state.currentCycle}
          cycleIsFinished={state.currentCycleIsFinished}
          cyclePuzzles={state.cyclePuzzlesQuery.data ?? emptyCyclePuzzles}
          cycleStats={state.cycleStats}
          failedCyclePuzzleIris={state.failedCyclePuzzleIris}
          hasActiveCycle={Boolean(state.effectiveActiveCycleIri && state.effectiveActiveTrainingSessionIri)}
          isTrainingSessionPending={Boolean(state.currentCycle) && !state.effectiveActiveTrainingSessionIri}
          onBackToDashboard={() => navigateToView('dashboard')}
          onBackToDetail={() => navigateToView('detail')}
          onPuzzleCompleted={(result) => {
            if (!state.selectedCyclePuzzle || !state.effectiveActiveTrainingSessionIri || state.selectedCyclePuzzleIsSaved) {
              return;
            }
            void state.recordSolverAttempt({
              attemptNumber: result.attemptNumber,
              clientRequestId: result.clientRequestId,
              cyclePuzzle: state.selectedCyclePuzzle,
              cyclePuzzleDurationMilliseconds: result.cyclePuzzleDurationMilliseconds,
              durationMilliseconds: result.durationMilliseconds,
              result,
              successful: true,
              trainingSession: state.effectiveActiveTrainingSessionIri,
            });
          }}
          onPuzzleFailed={(result) => {
            if (!state.selectedCyclePuzzle || !state.effectiveActiveTrainingSessionIri || state.selectedCyclePuzzleIsSaved) {
              return;
            }
            void state.recordSolverAttempt({
              attemptNumber: result.attemptNumber,
              clientRequestId: result.clientRequestId,
              cyclePuzzle: state.selectedCyclePuzzle,
              cyclePuzzleDurationMilliseconds: result.cyclePuzzleDurationMilliseconds,
              durationMilliseconds: result.durationMilliseconds,
              result,
              successful: false,
              trainingSession: state.effectiveActiveTrainingSessionIri,
            });
          }}
          onPuzzleProgress={(value) => state.persistSolverProgress(value)}
          onPuzzleSelect={state.setSelectedTrainingPuzzleIri}
          savedCyclePuzzleIris={state.savedCyclePuzzleIris}
          selectedPuzzle={state.selectedPuzzle}
          selectedTraining={state.selectedTraining}
          selectedTrainingPuzzle={state.selectedTrainingPuzzle}
          summary={state.trainingSummaryQuery.data ?? null}
          trainingPuzzles={state.trainingPuzzlesQuery.data ?? emptySolverTrainingPuzzles}
        />
      )}
      {state.activeView === 'stats' && (
        <TrainingsStatsView
          errorMessage={state.statsOverviewQuery.error?.message}
          isError={state.statsOverviewQuery.isError}
          isLoading={state.statsOverviewQuery.isLoading}
          onOpenTraining={navigateToTraining}
          onSelectTrainingIri={state.setSelectedTrainingIri}
          selectedTrainingIri={state.selectedTrainingIri}
          statsOverview={state.statsOverviewQuery.data ?? null}
          summary={state.trainingSummaryQuery.data ?? null}
          summaryError={state.trainingSummaryQuery.error?.message}
          summaryIsError={state.trainingSummaryQuery.isError}
          summaryIsLoading={state.trainingSummaryQuery.isLoading}
        />
      )}
      {state.activeView === 'history' && (
        <HistoryOverviewView
          initialFilterPreset={state.historyFilterPreset}
          attemptHistory={state.trainingAttemptHistoryQuery.data ?? null}
          cycleHistory={state.trainingCycleHistoryQuery.data ?? null}
          detailedErrorMessage={state.trainingAttemptHistoryQuery.error?.message ?? state.trainingCycleHistoryQuery.error?.message}
          errorMessage={state.historyOverviewQuery.error?.message}
          historyOverview={state.historyOverviewQuery.data ?? null}
          isDetailedError={state.trainingAttemptHistoryQuery.isError || state.trainingCycleHistoryQuery.isError}
          isDetailedLoading={state.trainingAttemptHistoryQuery.isLoading || state.trainingCycleHistoryQuery.isLoading}
          isError={state.historyOverviewQuery.isError}
          isLoading={state.historyOverviewQuery.isLoading}
          onInitialFilterPresetApplied={() => state.setHistoryFilterPreset(null)}
          onBackToDashboard={() => navigateToView('dashboard')}
          onOpenTraining={navigateToTraining}
          selectedTraining={state.selectedTraining}
        />
      )}
      {state.activeView === 'settings' && (
        <SettingsOverviewView
          errorMessage={state.userSettingsOverviewQuery.error?.message}
          isError={state.userSettingsOverviewQuery.isError}
          isLoading={state.userSettingsOverviewQuery.isLoading}
          isSaving={state.saveUserSettingsMutation.isPending}
          onBackToDashboard={() => navigateToView('dashboard')}
          onSave={(value) => state.saveUserSettingsMutation.mutateAsync(value)}
          saveErrorMessage={state.saveUserSettingsMutation.error?.message}
          settingsOverview={state.userSettingsOverviewQuery.data ?? null}
        />
      )}
      </section>
    </>
  );
}
export { TrainingsPanelContentScreen };




