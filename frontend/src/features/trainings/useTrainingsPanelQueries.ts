import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/client';
import type { AuthSession } from '../auth/authStorage';
import { apiPathFromIri, buildCycleStats, fetchAllCollection } from './trainingsUtils';
import type { Puzzle, Training, TrainingDashboardSummary, TrainingOverview, TrainingSummary } from './trainingsTypes';
import type { useTrainingsPanelUiState } from './useTrainingsPanelUiState';

type UiState = ReturnType<typeof useTrainingsPanelUiState>;

export function useTrainingsPanelQueries(session: AuthSession, uiState: UiState) {
  const trainingsQuery = useQuery({
    queryKey: ['trainings', session.email],
    queryFn: () => fetchAllCollection<Training>('/trainings', session.token),
  });

  const dashboardSummariesQuery = useQuery({
    queryKey: ['training-dashboard', session.email],
    enabled: uiState.activeView === 'dashboard',
    queryFn: () => apiRequest<TrainingDashboardSummary[]>('/trainings/dashboard', { token: session.token }),
  });

  const effectiveSelectedTrainingIri =
    uiState.selectedTrainingIri ?? trainingsQuery.data?.[0]?.['@id'] ?? null;
  const selectedTraining =
    trainingsQuery.data?.find((training) => training['@id'] === effectiveSelectedTrainingIri) ?? null;
  const effectiveMistakeLimit = uiState.mistakeLimitOverride ?? selectedTraining?.mistakeLimit ?? 3;
  const needsTrainingOverview =
    uiState.activeView === 'detail' || uiState.activeView === 'import' || uiState.activeView === 'solver';
  const needsTrainingSummary = uiState.activeView === 'detail';

  const trainingOverviewQuery = useQuery({
    queryKey: ['training-overview', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri) && needsTrainingOverview,
    queryFn: () =>
      apiRequest<TrainingOverview>(`${apiPathFromIri(effectiveSelectedTrainingIri ?? '')}/overview`, {
        token: session.token,
      }),
  });

  const trainingSummaryQuery = useQuery({
    queryKey: ['training-summary', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri) && needsTrainingSummary,
    queryFn: () =>
      apiRequest<TrainingSummary>(`${apiPathFromIri(effectiveSelectedTrainingIri ?? '')}/summary`, {
        token: session.token,
      }),
  });

  const trainingPuzzles = trainingOverviewQuery.data?.trainingPuzzles ?? [];
  const cycles = trainingOverviewQuery.data?.cycles ?? [];
  const trainingCyclePuzzles = trainingOverviewQuery.data?.cyclePuzzles ?? [];
  const trainingSessions = trainingOverviewQuery.data?.trainingSessions ?? [];

  const effectiveActiveCycleIri =
    uiState.activeCycleIri ?? cycles.filter((cycle) => cycle.status === 'active').at(-1)?.['@id'] ?? null;

  const activeCyclePuzzles = trainingCyclePuzzles.filter(
    (cyclePuzzle) => cyclePuzzle.cycle === effectiveActiveCycleIri,
  );

  const defaultCyclePuzzle =
    activeCyclePuzzles.find(
      (cyclePuzzle) =>
        cyclePuzzle.status === 'pending' &&
        !uiState.savedCyclePuzzleIris.has(cyclePuzzle['@id']) &&
        !uiState.failedCyclePuzzleIris.has(cyclePuzzle['@id']),
    ) ??
    activeCyclePuzzles.find(
      (cyclePuzzle) =>
        cyclePuzzle.status !== 'solved' &&
        !uiState.savedCyclePuzzleIris.has(cyclePuzzle['@id']) &&
        (cyclePuzzle.status === 'failed' || uiState.failedCyclePuzzleIris.has(cyclePuzzle['@id'])),
    ) ??
    null;

  const effectiveSelectedTrainingPuzzleIri =
    uiState.selectedTrainingPuzzleIri ?? defaultCyclePuzzle?.trainingPuzzle ?? trainingPuzzles[0]?.['@id'] ?? null;

  const selectedTrainingPuzzle =
    trainingPuzzles.find((trainingPuzzle) => trainingPuzzle['@id'] === effectiveSelectedTrainingPuzzleIri) ?? null;

  const selectedTrainingPuzzleLinkedPuzzle =
    selectedTrainingPuzzle && typeof selectedTrainingPuzzle.puzzle === 'string'
      ? selectedTrainingPuzzle.puzzle
      : null;

  const selectedPuzzleQuery = useQuery({
    queryKey: ['puzzle', session.email, selectedTrainingPuzzleLinkedPuzzle],
    enabled: uiState.activeView === 'solver' && Boolean(selectedTrainingPuzzleLinkedPuzzle),
    queryFn: () =>
      apiRequest<Puzzle>(apiPathFromIri(selectedTrainingPuzzleLinkedPuzzle ?? ''), {
        token: session.token,
      }),
  });

  const selectedPuzzle =
    selectedTrainingPuzzle && selectedTrainingPuzzle.puzzle && typeof selectedTrainingPuzzle.puzzle !== 'string'
      ? selectedTrainingPuzzle.puzzle
      : selectedPuzzleQuery.data;
  const selectedPuzzleCount = trainingPuzzles.length;

  const effectiveActiveTrainingSessionIri =
    uiState.activeTrainingSessionIri ??
    trainingSessions.filter((trainingSession) => trainingSession.cycle === effectiveActiveCycleIri).at(-1)?.['@id'] ??
    null;

  const selectedCyclePuzzle =
    activeCyclePuzzles.find(
      (cyclePuzzle) => cyclePuzzle.trainingPuzzle === selectedTrainingPuzzle?.['@id'],
    ) ?? null;
  const selectedCyclePuzzleIsSaved = selectedCyclePuzzle
    ? selectedCyclePuzzle.status === 'solved' || uiState.savedCyclePuzzleIris.has(selectedCyclePuzzle['@id'])
    : false;

  const cycleStats = buildCycleStats(
    activeCyclePuzzles,
    uiState.savedCyclePuzzleIris,
    uiState.failedCyclePuzzleIris,
    selectedPuzzleCount,
  );
  const currentCycle = cycles.find((cycle) => cycle['@id'] === effectiveActiveCycleIri) ?? null;
  const currentCycleIsFinished = cycleStats.total > 0 && cycleStats.pending === 0;
  const currentCycleStatusLabel = currentCycleIsFinished
    ? 'Termine'
    : currentCycle?.status === 'active'
      ? 'Actif'
      : 'Aucun';
  const hasResumableCycle = currentCycle?.status === 'active' && !currentCycleIsFinished;
  const puzzleListIsLocked = cycles.length > 0;

  const trainingPuzzlesQuery = { ...trainingOverviewQuery, data: trainingPuzzles };
  const cyclesQuery = { ...trainingOverviewQuery, data: cycles };
  const cyclePuzzlesQuery = { ...trainingOverviewQuery, data: activeCyclePuzzles };
  const trainingCyclePuzzlesQuery = { ...trainingOverviewQuery, data: trainingCyclePuzzles };
  const trainingSessionsQuery = { ...trainingOverviewQuery, data: trainingSessions };

  return {
    cyclePuzzlesQuery,
    cycleStats,
    currentCycle,
    currentCycleIsFinished,
    currentCycleStatusLabel,
    cyclesQuery,
    dashboardSummariesQuery,
    effectiveActiveCycleIri,
    effectiveActiveTrainingSessionIri,
    effectiveMistakeLimit,
    effectiveSelectedTrainingIri,
    hasResumableCycle,
    puzzleListIsLocked,
    selectedCyclePuzzle,
    selectedCyclePuzzleIsSaved,
    selectedPuzzle,
    selectedPuzzleCount,
    selectedTraining,
    selectedTrainingPuzzle,
    trainingCyclePuzzlesQuery,
    trainingOverviewQuery,
    trainingPuzzlesQuery,
    trainingSessionsQuery,
    trainingSummaryQuery,
    trainingsQuery,
  };
}
