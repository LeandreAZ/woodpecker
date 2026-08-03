import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/client';
import type { AuthSession } from '../auth/authStorage';
import { apiPathFromIri, buildCycleStats, fetchAllCollection } from './trainingsUtils';
import type {
  Attempt,
  Cycle,
  CyclePuzzle,
  Puzzle,
  Training,
  TrainingPuzzle,
  TrainingSession,
} from './trainingsTypes';
import type { useTrainingsPanelUiState } from './useTrainingsPanelUiState';

type UiState = ReturnType<typeof useTrainingsPanelUiState>;

export function useTrainingsPanelQueries(session: AuthSession, uiState: UiState) {
  const trainingsQuery = useQuery({
    queryKey: ['trainings', session.email],
    queryFn: () => fetchAllCollection<Training>('/trainings', session.token),
  });

  const effectiveSelectedTrainingIri =
    uiState.selectedTrainingIri ?? trainingsQuery.data?.[0]?.['@id'] ?? null;
  const selectedTraining =
    trainingsQuery.data?.find((training) => training['@id'] === effectiveSelectedTrainingIri) ?? null;
  const effectiveMistakeLimit = uiState.mistakeLimitOverride ?? selectedTraining?.mistakeLimit ?? 3;

  const trainingPuzzlesQuery = useQuery({
    queryKey: ['training-puzzles', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri),
    queryFn: async () => {
      const trainingPuzzles = await fetchAllCollection<TrainingPuzzle>(
        '/training_puzzles',
        session.token,
      );

      return trainingPuzzles
        .filter((trainingPuzzle) => trainingPuzzle.training === effectiveSelectedTrainingIri)
        .sort((left, right) => left.position - right.position);
    },
  });

  const cyclesQuery = useQuery({
    queryKey: ['cycles', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri),
    queryFn: async () => {
      const cycles = await fetchAllCollection<Cycle>('/cycles', session.token);

      return cycles
        .filter((cycle) => cycle.training === effectiveSelectedTrainingIri)
        .sort((left, right) => left.number - right.number);
    },
  });

  const effectiveActiveCycleIri =
    uiState.activeCycleIri ??
    cyclesQuery.data?.filter((cycle) => cycle.status === 'active').at(-1)?.['@id'] ??
    null;

  const cyclePuzzlesQuery = useQuery({
    queryKey: ['cycle-puzzles', session.email, effectiveActiveCycleIri],
    enabled: Boolean(effectiveActiveCycleIri),
    queryFn: async () => {
      const cyclePuzzles = await fetchAllCollection<CyclePuzzle>('/cycle_puzzles', session.token);

      return cyclePuzzles
        .filter((cyclePuzzle) => cyclePuzzle.cycle === effectiveActiveCycleIri)
        .sort((left, right) => left.position - right.position);
    },
  });

  const trainingCyclePuzzlesQuery = useQuery({
    queryKey: ['training-cycle-puzzles', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri && cyclesQuery.data),
    queryFn: async () => {
      const cycleIris = new Set((cyclesQuery.data ?? []).map((cycle) => cycle['@id']));
      const cyclePuzzles = await fetchAllCollection<CyclePuzzle>('/cycle_puzzles', session.token);

      return cyclePuzzles
        .filter((cyclePuzzle) => cycleIris.has(cyclePuzzle.cycle))
        .sort((left, right) => left.position - right.position);
    },
  });

  const trainingSessionsQuery = useQuery({
    queryKey: ['training-sessions', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri),
    queryFn: async () => {
      const trainingSessions = await fetchAllCollection<TrainingSession>(
        '/training_sessions',
        session.token,
      );

      return trainingSessions.filter(
        (trainingSession) => trainingSession.training === effectiveSelectedTrainingIri,
      );
    },
  });

  const activeCyclePuzzles = cyclePuzzlesQuery.data ?? [];
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
    uiState.selectedTrainingPuzzleIri ??
    defaultCyclePuzzle?.trainingPuzzle ??
    trainingPuzzlesQuery.data?.[0]?.['@id'] ??
    null;

  const selectedTrainingPuzzle =
    trainingPuzzlesQuery.data?.find(
      (trainingPuzzle) => trainingPuzzle['@id'] === effectiveSelectedTrainingPuzzleIri,
    ) ?? null;

  const selectedTrainingPuzzleLinkedPuzzle =
    selectedTrainingPuzzle && typeof selectedTrainingPuzzle.puzzle === 'string'
      ? selectedTrainingPuzzle.puzzle
      : null;

  const selectedPuzzleQuery = useQuery({
    queryKey: ['puzzle', session.email, selectedTrainingPuzzleLinkedPuzzle],
    enabled: Boolean(selectedTrainingPuzzleLinkedPuzzle),
    queryFn: () =>
      apiRequest<Puzzle>(apiPathFromIri(selectedTrainingPuzzleLinkedPuzzle ?? ''), {
        token: session.token,
      }),
  });

  const selectedPuzzle =
    selectedTrainingPuzzle && typeof selectedTrainingPuzzle.puzzle !== 'string'
      ? selectedTrainingPuzzle.puzzle
      : selectedPuzzleQuery.data;
  const selectedPuzzleCount = trainingPuzzlesQuery.data?.length ?? 0;

  const effectiveActiveTrainingSessionIri =
    uiState.activeTrainingSessionIri ??
    trainingSessionsQuery.data
      ?.filter((trainingSession) => trainingSession.cycle === effectiveActiveCycleIri)
      .at(-1)?.['@id'] ??
    null;

  const attemptsQuery = useQuery({
    queryKey: ['attempts', session.email, effectiveSelectedTrainingIri],
    enabled: Boolean(effectiveSelectedTrainingIri && trainingSessionsQuery.data),
    queryFn: async () => {
      const trainingSessionIris = new Set(
        (trainingSessionsQuery.data ?? []).map((trainingSession) => trainingSession['@id']),
      );
      const attempts = await fetchAllCollection<Attempt>('/attempts', session.token);

      return attempts
        .filter((attempt) => trainingSessionIris.has(attempt.trainingSession))
        .sort(
          (left, right) =>
            new Date(right.attemptedAt).getTime() - new Date(left.attemptedAt).getTime(),
        );
    },
  });

  const selectedCyclePuzzle =
    cyclePuzzlesQuery.data?.find(
      (cyclePuzzle) => cyclePuzzle.trainingPuzzle === selectedTrainingPuzzle?.['@id'],
    ) ?? null;
  const selectedCyclePuzzleIsSaved = selectedCyclePuzzle
    ? selectedCyclePuzzle.status === 'solved' || uiState.savedCyclePuzzleIris.has(selectedCyclePuzzle['@id'])
    : false;

  const cycleStats = buildCycleStats(
    cyclePuzzlesQuery.data ?? [],
    uiState.savedCyclePuzzleIris,
    uiState.failedCyclePuzzleIris,
    selectedPuzzleCount,
  );
  const currentCycle = cyclesQuery.data?.find((cycle) => cycle['@id'] === effectiveActiveCycleIri) ?? null;
  const currentCycleIsFinished = cycleStats.total > 0 && cycleStats.pending === 0;
  const currentCycleStatusLabel = currentCycleIsFinished
    ? 'Termine'
    : currentCycle?.status === 'active'
      ? 'Actif'
      : 'Aucun';
  const hasResumableCycle = currentCycle?.status === 'active' && !currentCycleIsFinished;
  const puzzleListIsLocked = (cyclesQuery.data?.length ?? 0) > 0;

  return {
    attemptsQuery,
    cyclePuzzlesQuery,
    cycleStats,
    currentCycle,
    currentCycleIsFinished,
    currentCycleStatusLabel,
    cyclesQuery,
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
    trainingPuzzlesQuery,
    trainingSessionsQuery,
    trainingsQuery,
  };
}
