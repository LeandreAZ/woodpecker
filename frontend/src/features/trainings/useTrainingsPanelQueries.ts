import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '../../shared/api/client';
import type { AuthSession } from '../auth/authStorage';
import {
  getPreviewDashboardSummaries,
  getPreviewHistoryOverview,
  getPreviewPuzzle,
  getPreviewStatsOverview,
  getPreviewTrainingAnalytics,
  getPreviewTrainingAttemptHistory,
  getPreviewTrainingCycleHistory,
  getPreviewTrainingOverview,
  getPreviewTrainingSummary,
  getPreviewTrainings,
  getPreviewUserSettingsOverview,
  isPreviewSession,
} from './previewData';
import { apiPathFromIri, buildCycleStats } from './trainingsUtils';
import type {
  HistoryOverview,
  Puzzle,
  StatsOverview,
  Training,
  TrainingAnalytics,
  TrainingAttemptHistory,
  TrainingCycleHistory,
  TrainingDashboardSummary,
  TrainingOverview,
  TrainingSummary,
  UserSettingsOverview,
} from './trainingsTypes';
import type { useTrainingsPanelUiState } from './useTrainingsPanelUiState';
import { fetchAllCollection } from './trainingsUtils';

type UiState = ReturnType<typeof useTrainingsPanelUiState>;

function hasSolvedAttempt(cyclePuzzle?: TrainingOverview['cyclePuzzles'][number] | null) {
  if (!cyclePuzzle) {
    return false;
  }

  if (typeof cyclePuzzle.hasSolvedAttempt === 'boolean') {
    return cyclePuzzle.hasSolvedAttempt;
  }

  return cyclePuzzle.attempts?.some((attempt) => attempt.status === 'solved') ?? false;
}

export function useTrainingsPanelQueries(session: AuthSession, uiState: UiState) {
  const previewMode = isPreviewSession(session);

  const trainingsQuery = useQuery({
    queryKey: ['trainings', session.email],
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewTrainings())
        : fetchAllCollection<Training>('/trainings', session.token),
  });

  const dashboardSummariesQuery = useQuery({
    queryKey: ['training-dashboard', session.email, previewMode ? 'preview' : 'local'],
    enabled: uiState.activeView === 'dashboard',
    queryFn: async () => {
      if (previewMode) {
        return getPreviewDashboardSummaries();
      }

      try {
        return await apiRequest<TrainingDashboardSummary[]>('/trainings/dashboard', { token: session.token });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return [];
        }

        throw error;
      }
    },
  });

  const statsOverviewQuery = useQuery({
    queryKey: ['stats-overview', session.email],
    enabled: uiState.activeView === 'stats' || uiState.activeView === 'dashboard',
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewStatsOverview())
        : apiRequest<StatsOverview>('/stats/overview', { token: session.token }),
  });

  const historyOverviewQuery = useQuery({
    queryKey: ['history-overview', session.email],
    enabled: uiState.activeView === 'history',
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewHistoryOverview())
        : apiRequest<HistoryOverview>('/history/overview', { token: session.token }),
  });

  const effectiveSelectedTrainingIri =
    uiState.selectedTrainingIri ?? trainingsQuery.data?.[0]?.['@id'] ?? null;

  const trainingAttemptHistoryQuery = useQuery({
    queryKey: ['training-attempt-history', session.email, effectiveSelectedTrainingIri],
    enabled: false,
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewTrainingAttemptHistory(effectiveSelectedTrainingIri ?? '/trainings/1'))
        : apiRequest<TrainingAttemptHistory>(`${apiPathFromIri(effectiveSelectedTrainingIri ?? '')}/attempt-history`, {
            token: session.token,
          }),
  });

  const trainingCycleHistoryQuery = useQuery({
    queryKey: ['training-cycle-history', session.email, effectiveSelectedTrainingIri],
    enabled: false,
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewTrainingCycleHistory(effectiveSelectedTrainingIri ?? '/trainings/1'))
        : apiRequest<TrainingCycleHistory>(`${apiPathFromIri(effectiveSelectedTrainingIri ?? '')}/cycle-history`, {
            token: session.token,
          }),
  });

  const userSettingsOverviewQuery = useQuery({
    queryKey: ['user-settings-overview', session.email],
    enabled: uiState.activeView === 'settings' || uiState.activeView === 'solver',
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewUserSettingsOverview())
        : apiRequest<UserSettingsOverview>('/users/me/overview', { token: session.token }),
  });

  const selectedTraining =
    trainingsQuery.data?.find((training) => training['@id'] === effectiveSelectedTrainingIri) ?? null;
  const needsTrainingOverview =
    uiState.activeView === 'detail' || uiState.activeView === 'import' || uiState.activeView === 'solver';
  const needsTrainingSummary = uiState.activeView === 'detail' || uiState.activeView === 'stats';
  const needsTrainingAnalytics = uiState.activeView === 'detail';

  const trainingOverviewQuery = useQuery({
    queryKey: ['training-overview', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri) && needsTrainingOverview,
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewTrainingOverview(effectiveSelectedTrainingIri ?? '/trainings/1'))
        : apiRequest<TrainingOverview>(`${apiPathFromIri(effectiveSelectedTrainingIri ?? '')}/overview`, {
            token: session.token,
          }),
  });

  const trainingSummaryQuery = useQuery({
    queryKey: ['training-summary', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri) && needsTrainingSummary,
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewTrainingSummary(effectiveSelectedTrainingIri ?? '/trainings/1'))
        : apiRequest<TrainingSummary>(`${apiPathFromIri(effectiveSelectedTrainingIri ?? '')}/summary`, {
            token: session.token,
          }),
  });

  const trainingAnalyticsQuery = useQuery({
    queryKey: ['training-analytics', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri) && needsTrainingAnalytics,
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewTrainingAnalytics(effectiveSelectedTrainingIri ?? '/trainings/1'))
        : apiRequest<TrainingAnalytics>(`${apiPathFromIri(effectiveSelectedTrainingIri ?? '')}/analytics`, {
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
    activeCyclePuzzles.find((cyclePuzzle) => cyclePuzzle.status === 'in_progress') ??
    activeCyclePuzzles.find((cyclePuzzle) => cyclePuzzle.status === 'failed' && !hasSolvedAttempt(cyclePuzzle)) ??
    activeCyclePuzzles.find((cyclePuzzle) => cyclePuzzle.status === 'pending') ??
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
      previewMode
        ? Promise.resolve(getPreviewPuzzle(selectedTrainingPuzzleLinkedPuzzle ?? '') as Puzzle)
        : apiRequest<Puzzle>(apiPathFromIri(selectedTrainingPuzzleLinkedPuzzle ?? ''), {
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
    ? selectedCyclePuzzle.status === 'solved' ||
      (selectedCyclePuzzle.status === 'failed' && hasSolvedAttempt(selectedCyclePuzzle)) ||
      uiState.savedCyclePuzzleIris.has(selectedCyclePuzzle['@id'])
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
    effectiveSelectedTrainingIri,
    hasResumableCycle,
    historyOverviewQuery,
    trainingAttemptHistoryQuery,
    trainingCycleHistoryQuery,
    puzzleListIsLocked,
    selectedCyclePuzzle,
    selectedCyclePuzzleIsSaved,
    selectedPuzzle,
    selectedPuzzleCount,
    selectedTraining,
    selectedTrainingPuzzle,
    statsOverviewQuery,
    trainingAnalyticsQuery,
    trainingCyclePuzzlesQuery,
    trainingOverviewQuery,
    trainingPuzzlesQuery,
    trainingSessionsQuery,
    trainingSummaryQuery,
    trainingsQuery,
    userSettingsOverviewQuery,
  };
}




