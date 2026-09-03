import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMultipartRequest, apiRequest } from '../../shared/api/client';
import type { AuthSession } from '../auth/authStorage';
import type { PuzzleCompletionResult } from './PuzzleSolver';
import type { SupportedLanguage, SupportedTheme } from './chessboardPreferences';
import { parseOptionalRating, validatePuzzleInput } from './puzzleValidation';
import {
  DEFAULT_TRAINING_BRANDING,
  normalizeTrainingBackgroundColor,
  normalizeTrainingIconColor,
  normalizeTrainingPiece,
} from './TrainingBranding';
import {
  apiPathFromIri,
  getNextTrainingPuzzlePosition,
  splitList,
  updateTrainingPuzzlePosition,
} from './trainingsUtils';
import type {
  Attempt,
  Cycle,
  CyclePuzzle,
  Puzzle,
  Training,
  TrainingPuzzle,
  TrainingOverview,
  TrainingSession,
  UserSettingsOverview,
  View,
} from './trainingsTypes';
import {
  createSolverAttemptClientRequestId,
  listPendingSolverAttempts,
  removePendingSolverAttempt,
  upsertPendingSolverAttempt,
} from './solverPersistence';
import type { useTrainingsPanelQueries } from './useTrainingsPanelQueries';
import type { useTrainingsPanelUiState } from './useTrainingsPanelUiState';

type UiState = ReturnType<typeof useTrainingsPanelUiState>;
type Queries = ReturnType<typeof useTrainingsPanelQueries>;

type SolverAttemptSyncInput = {
  attemptNumber: number;
  clientRequestId?: string;
  cyclePuzzle: CyclePuzzle;
  cyclePuzzleDurationMilliseconds: number;
  durationMilliseconds: number;
  keepalive?: boolean;
  mistakesCount: number;
  playedMoves: string[];
  status: 'in_progress' | 'failed' | 'solved';
  trainingSession: string;
};

function getCompletedAttemptCount(cyclePuzzle: CyclePuzzle) {
  if (typeof cyclePuzzle.completedAttemptCount === 'number') {
    return cyclePuzzle.completedAttemptCount;
  }

  return cyclePuzzle.attempts?.filter((attempt) => attempt.status !== 'in_progress').length ?? 0;
}

function getHasSolvedAttempt(cyclePuzzle: CyclePuzzle) {
  if (typeof cyclePuzzle.hasSolvedAttempt === 'boolean') {
    return cyclePuzzle.hasSolvedAttempt;
  }

  return cyclePuzzle.attempts?.some((attempt) => attempt.status === 'solved') ?? false;
}

function buildOptimisticAttempt(cyclePuzzle: CyclePuzzle, value: SolverAttemptSyncInput): Attempt {
  const matchingAttempt = cyclePuzzle.attempts?.find((attempt) =>
    (value.clientRequestId && attempt.clientRequestId === value.clientRequestId)
      || attempt.attemptNumber === value.attemptNumber
  );

  return {
    '@id': matchingAttempt?.['@id'] ?? cyclePuzzle.activeAttempt?.['@id'] ?? '',
    id: matchingAttempt?.id ?? cyclePuzzle.activeAttempt?.id ?? 0,
    attemptNumber: value.attemptNumber,
    clientRequestId: value.clientRequestId ?? matchingAttempt?.clientRequestId ?? cyclePuzzle.activeAttempt?.clientRequestId ?? null,
    cyclePuzzle: cyclePuzzle['@id'],
    trainingSession: value.trainingSession,
    status: value.status,
    playedMoves: value.playedMoves,
    successful: value.status === 'solved',
    mistakesCount: value.mistakesCount,
    durationMilliseconds: value.durationMilliseconds,
    startedAt: matchingAttempt?.startedAt ?? cyclePuzzle.activeAttempt?.startedAt ?? new Date().toISOString(),
    completedAt: value.status === 'in_progress' ? null : new Date().toISOString(),
    attemptedAt: value.status === 'in_progress' ? null : new Date().toISOString(),
  };
}

function buildOptimisticAttempts(cyclePuzzle: CyclePuzzle, value: SolverAttemptSyncInput, optimisticAttempt: Attempt) {
  const remainingAttempts = (cyclePuzzle.attempts ?? []).filter((attempt) => {
    if (value.clientRequestId && attempt.clientRequestId === value.clientRequestId) {
      return false;
    }

    return attempt.attemptNumber !== value.attemptNumber;
  });

  if (value.status === 'in_progress') {
    return [...remainingAttempts, optimisticAttempt];
  }

  return [...remainingAttempts, optimisticAttempt]
    .filter((attempt) => attempt.status !== 'in_progress');
}

export function useTrainingsPanelActions(
  session: AuthSession,
  uiState: UiState,
  queries: Queries,
) {
  const queryClient = useQueryClient();
  const ensuredTrainingSessionCycleIriRef = useRef<string | null>(null);

  function updateCyclePuzzleOverviewCache(
    trainingIri: string | null | undefined,
    cyclePuzzleIri: string,
    patch: Partial<CyclePuzzle>,
  ) {
    if (!trainingIri) {
      return;
    }

    queryClient.setQueryData<TrainingOverview | undefined>(
      ['training-overview', session.email, trainingIri],
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          cyclePuzzles: current.cyclePuzzles.map((cyclePuzzle) =>
            cyclePuzzle['@id'] === cyclePuzzleIri ? { ...cyclePuzzle, ...patch } : cyclePuzzle,
          ),
        };
      },
    );
  }

  function buildOptimisticCyclePuzzlePatch(
    cyclePuzzle: CyclePuzzle,
    value: SolverAttemptSyncInput,
  ): Partial<CyclePuzzle> {
    const optimisticAttempt = buildOptimisticAttempt(cyclePuzzle, value);
    const optimisticAttempts = buildOptimisticAttempts(cyclePuzzle, value, optimisticAttempt);
    const nextCompletedAttemptCount = optimisticAttempts.filter((attempt) => attempt.status !== 'in_progress').length;
    const nextHasSolvedAttempt = optimisticAttempts.some((attempt) => attempt.status === 'solved');
    const nextHasFailedAttempt = optimisticAttempts.some((attempt) => attempt.status === 'failed');
    const nextStatus = nextHasSolvedAttempt
      ? nextHasFailedAttempt
        ? 'failed'
        : 'solved'
      : value.status === 'failed' || nextHasFailedAttempt
        ? 'failed'
        : value.status === 'in_progress'
          ? 'in_progress'
          : cyclePuzzle.status === 'in_progress'
            ? 'in_progress'
            : 'pending';

    return {
      activeAttempt: value.status === 'in_progress' ? optimisticAttempt : null,
      attempts: optimisticAttempts,
      attemptCount: nextCompletedAttemptCount,
      completedAttemptCount: nextCompletedAttemptCount,
      completedAt: nextHasSolvedAttempt ? cyclePuzzle.completedAt ?? new Date().toISOString() : null,
      durationMilliseconds: Math.max(cyclePuzzle.durationMilliseconds ?? 0, value.cyclePuzzleDurationMilliseconds),
      hasSolvedAttempt: nextHasSolvedAttempt,
      status: nextStatus,
    };
  }

  function persistSolverProgress(value: {
    attemptNumber: number;
    clientRequestId: string;
    cyclePuzzle: CyclePuzzle;
    cyclePuzzleDurationMilliseconds: number;
    durationMilliseconds: number;
    keepalive?: boolean;
    mistakesCount: number;
    playedMoves: string[];
    trainingSession: string;
  }) {
    return saveCyclePuzzleProgressMutation.mutateAsync({
      ...value,
      status: 'in_progress',
    });
  }

  function recordSolverAttempt(args: {
    attemptNumber: number;
    clientRequestId?: string;
    cyclePuzzle: CyclePuzzle;
    cyclePuzzleDurationMilliseconds: number;
    durationMilliseconds: number;
    result: PuzzleCompletionResult;
    successful: boolean;
    trainingSession: string;
  }) {
    return recordAttemptMutation.mutateAsync({
      attemptNumber: args.attemptNumber,
      clientRequestId: args.clientRequestId ?? createSolverAttemptClientRequestId(),
      cyclePuzzle: args.cyclePuzzle,
      cyclePuzzleDurationMilliseconds: args.cyclePuzzleDurationMilliseconds,
      durationMilliseconds: args.durationMilliseconds,
      keepalive: false,
      mistakesCount: args.result.mistakesCount,
      playedMoves: args.result.playedMoves,
      status: args.successful ? 'solved' : 'failed',
      trainingSession: args.trainingSession,
    });
  }

  async function flushPendingSolverPersistence() {
    const trainingIri = queries.effectiveSelectedTrainingIri;

    if (!trainingIri) {
      return;
    }

    const cyclePuzzleMap = new Map((queries.trainingCyclePuzzlesQuery.data ?? []).map((cyclePuzzle) => [cyclePuzzle['@id'], cyclePuzzle]));

    for (const pendingAttempt of listPendingSolverAttempts(trainingIri)) {
      const cyclePuzzle = cyclePuzzleMap.get(pendingAttempt.cyclePuzzleIri);
      if (!cyclePuzzle) {
        continue;
      }

      try {
        const mutation = pendingAttempt.status === 'in_progress' ? saveCyclePuzzleProgressMutation : recordAttemptMutation;
        await mutation.mutateAsync({
          attemptNumber: pendingAttempt.attemptNumber,
          clientRequestId: pendingAttempt.clientRequestId,
          cyclePuzzle,
          cyclePuzzleDurationMilliseconds: pendingAttempt.cyclePuzzleDurationMilliseconds,
          durationMilliseconds: pendingAttempt.durationMilliseconds,
          keepalive: true,
          mistakesCount: pendingAttempt.mistakesCount,
          playedMoves: pendingAttempt.playedMoves,
          status: pendingAttempt.status,
          trainingSession: pendingAttempt.trainingSession,
        });
      } catch {
        return;
      }
    }
  }

  async function invalidateTrainingData(trainingIri = queries.effectiveSelectedTrainingIri) {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['training-dashboard', session.email],
      }),
      queryClient.invalidateQueries({
        queryKey: ['stats-overview', session.email],
      }),
      queryClient.invalidateQueries({
        queryKey: ['history-overview', session.email],
      }),
      queryClient.invalidateQueries({
        queryKey: ['training-analytics', session.email, trainingIri],
      }),
      queryClient.invalidateQueries({
        queryKey: ['training-attempt-history', session.email, trainingIri],
      }),
      queryClient.invalidateQueries({
        queryKey: ['training-cycle-history', session.email, trainingIri],
      }),
      queryClient.invalidateQueries({
        queryKey: ['training-overview', session.email, trainingIri],
      }),
      queryClient.invalidateQueries({
        queryKey: ['training-summary', session.email, trainingIri],
      }),
    ]);
  }

  function resetTrainingDraft() {
    uiState.setName('');
    uiState.setDescription('');
    uiState.setIcon(DEFAULT_TRAINING_BRANDING.icon);
    uiState.setIconBackgroundColor(DEFAULT_TRAINING_BRANDING.iconBackgroundColor);
    uiState.setIconColor(DEFAULT_TRAINING_BRANDING.iconColor);
  }

  function hydrateTrainingDraft(training: Training | null) {
    resetTrainingDraft();
    if (!training) {
      return;
    }
    uiState.setName(training.name ?? '');
    uiState.setDescription(training.description ?? '');
    uiState.setIcon(normalizeTrainingPiece(training.icon));
    uiState.setIconBackgroundColor(normalizeTrainingBackgroundColor(training.iconBackgroundColor));
    uiState.setIconColor(normalizeTrainingIconColor(training.iconColor));
  }

  const createTrainingMutation = useMutation({
    mutationFn: async () =>
      apiRequest<Training>('/trainings', {
        method: 'POST',
        token: session.token,
        body: {
          name: uiState.name.trim(),
          description: uiState.description.trim() || null,
          icon: normalizeTrainingPiece(uiState.icon),
          iconBackgroundColor: normalizeTrainingBackgroundColor(uiState.iconBackgroundColor),
          iconColor: normalizeTrainingIconColor(uiState.iconColor),
        },
      }),
    onSuccess: async (training) => {
      resetTrainingDraft();
      uiState.setSelectedTrainingIri(training['@id']);
      uiState.setSelectedTrainingPuzzleIri(null);
      uiState.setActiveView('detail');
      await queryClient.invalidateQueries({ queryKey: ['trainings', session.email] });
      await invalidateTrainingData(training['@id']);
    },
  });


  const updateTrainingMutation = useMutation({
    mutationFn: async () => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error("Selectionne un entrainement avant de l'enregistrer.");
      }

      return apiRequest<Training>(apiPathFromIri(queries.effectiveSelectedTrainingIri), {
        method: 'PATCH',
        token: session.token,
        contentType: 'application/merge-patch+json',
        body: {
          name: uiState.name.trim(),
          description: uiState.description.trim() || null,
          icon: normalizeTrainingPiece(uiState.icon),
          iconBackgroundColor: normalizeTrainingBackgroundColor(uiState.iconBackgroundColor),
          iconColor: normalizeTrainingIconColor(uiState.iconColor),
        },
      });
    },
    onSuccess: async (training) => {
      hydrateTrainingDraft(training);
      uiState.setSelectedTrainingIri(training['@id']);
      uiState.setActiveView('detail');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trainings', session.email] }),
        invalidateTrainingData(training['@id']),
      ]);
    },
  });

  const deleteTrainingMutation = useMutation({
    mutationFn: async (trainingIri: string) => {
      await apiRequest<void>(apiPathFromIri(trainingIri), {
        method: 'DELETE',
        token: session.token,
      });

      return trainingIri;
    },
    onSuccess: async (deletedTrainingIri) => {
      if (queries.effectiveSelectedTrainingIri === deletedTrainingIri) {
        const remainingTraining = (queries.trainingsQuery.data ?? []).find(
          (training) => training['@id'] !== deletedTrainingIri,
        );
        uiState.setSelectedTrainingIri(remainingTraining?.['@id'] ?? null);
        uiState.setSelectedTrainingPuzzleIri(null);
        uiState.setActiveCycleIri(null);
        uiState.setActiveTrainingSessionIri(null);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trainings', session.email] }),
        queryClient.invalidateQueries({ queryKey: ['training-dashboard', session.email] }),
        queryClient.invalidateQueries({ queryKey: ['stats-overview', session.email] }),
        queryClient.invalidateQueries({ queryKey: ['history-overview', session.email] }),
      ]);
    },
  });

  const createPuzzleMutation = useMutation({
    mutationFn: async () => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant d ajouter un puzzle.');
      }

      const validatedPuzzle = validatePuzzleInput({
        fen: uiState.fen,
        personalNote: uiState.personalNote,
        solution: splitList(uiState.solutionText),
        themes: splitList(uiState.themesText),
      });

      const puzzle = await apiRequest<Puzzle>('/puzzles', {
        method: 'POST',
        token: session.token,
        body: {
          fen: validatedPuzzle.normalizedFen,
          solution: validatedPuzzle.normalizedSolution,
          themes: validatedPuzzle.normalizedThemes,
          rating: parseOptionalRating(uiState.rating),
        },
      });

      const trainingPuzzle = await apiRequest<TrainingPuzzle>('/training_puzzles', {
        method: 'POST',
        token: session.token,
        body: {
          training: queries.effectiveSelectedTrainingIri,
          puzzle: puzzle['@id'],
          position: getNextTrainingPuzzlePosition(queries.trainingPuzzlesQuery.data ?? []),
          personalNote: validatedPuzzle.normalizedPersonalNote,
        },
      });

      return trainingPuzzle;
    },
    onSuccess: async (trainingPuzzle) => {
      uiState.setFen('');
      uiState.setSolutionText('');
      uiState.setThemesText('');
      uiState.setRating('');
      uiState.setPersonalNote('');
      uiState.setSelectedTrainingPuzzleIri(trainingPuzzle['@id']);
      uiState.setActiveView('detail');
      await invalidateTrainingData();
    },
  });

  const saveUserSettingsMutation = useMutation<UserSettingsOverview, Error, {
    appearance: { language: SupportedLanguage; theme: SupportedTheme };
    board: { darkSquareColor: string; lightSquareColor: string };
    profile: { pseudonym: string };
    solverPreferences: {
      animateMoves: boolean;
      showCoordinates: boolean;
      showLegalMoves: boolean;
      showRightClickTargets: boolean;
    };
  }>({
    mutationFn: async (value) =>
      apiRequest<UserSettingsOverview>('/users/me/settings', {
        method: 'PUT',
        token: session.token,
        body: value,
      }),
    onSuccess: async (payload) => {
      queryClient.setQueryData(['user-settings-overview', session.email], payload);
      await queryClient.invalidateQueries({ queryKey: ['user-settings-overview', session.email] });
    },
  });
  const analyzeCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant l analyse.');
      }
      const formData = new FormData();
      formData.append('file', file);
      return apiMultipartRequest<{ analysisId: string; totalRows: number; validCount: number; errorCount: number; duplicateCount: number; importableCount: number; errors: { line: number; message: string }[]; rows: Array<{ line: number; status: 'valid' | 'error' | 'duplicate'; duplicateReason?: 'file' | 'training'; message?: string; rating?: number; themes?: string[]; sourceId?: string }>; preview?: Array<{ rating: number; themes: string[] }> }>(
        apiPathFromIri(queries.effectiveSelectedTrainingIri) + '/imports/csv/analyze',
        formData,
        { token: session.token },
      );
    },
  });

  const importCsvMutation = useMutation({
    mutationFn: async (options: { analysisId: string; skipDuplicates: boolean; skipErroredPuzzles: boolean }) => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant l import.');
      }
      const formData = new FormData();
      formData.append('analysisId', options.analysisId);
      formData.append('skipDuplicates', String(options.skipDuplicates));
      formData.append('skipErroredPuzzles', String(options.skipErroredPuzzles));
      return apiMultipartRequest<{ importedCount: number }>(
        apiPathFromIri(queries.effectiveSelectedTrainingIri) + '/imports/csv',
        formData,
        { token: session.token },
      );
    },
    onSuccess: async () => {
      await invalidateTrainingData();
    },
  });

  async function estimateLichessAvailability(criteria: { count: number; minRating: number; maxRating: number; themes: string[]; minMoves?: number; maxMoves?: number }) {
    if (!queries.effectiveSelectedTrainingIri) {
      throw new Error('Selectionne un entrainement avant de consulter la disponibilité.');
    }

    const payload = await apiRequest<{ availableCount: number | null }>(
      apiPathFromIri(queries.effectiveSelectedTrainingIri) + '/imports/lichess/availability',
      { method: 'POST', token: session.token, body: criteria },
    );

    return payload.availableCount;
  }

  const importLichessMutation = useMutation({
    mutationFn: async (criteria: { count: number; minRating: number; maxRating: number; themes: string[]; distribution?: 'random' | 'custom'; themeDistribution?: Record<string, number>; minMoves?: number; maxMoves?: number }) => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant l import.');
      }
      return apiRequest<{ importedCount: number }>(
        apiPathFromIri(queries.effectiveSelectedTrainingIri) + '/imports/lichess',
        { method: 'POST', token: session.token, body: criteria },
      );
    },
    onSuccess: async () => {
      uiState.setActiveView('detail');
      await invalidateTrainingData();
    },
  });

  const deleteTrainingPuzzleMutation = useMutation({
    mutationFn: async (trainingPuzzleIri: string) => {
      if (queries.puzzleListIsLocked) {
        throw new Error('La liste de puzzles est verrouillee car un cycle existe deja.');
      }

      await apiRequest<void>(apiPathFromIri(trainingPuzzleIri), {
        method: 'DELETE',
        token: session.token,
      });

      return trainingPuzzleIri;
    },
    onSuccess: async (deletedTrainingPuzzleIri) => {
      if (uiState.selectedTrainingPuzzleIri === deletedTrainingPuzzleIri) {
        uiState.setSelectedTrainingPuzzleIri(null);
      }

      const remainingTrainingPuzzles = (queries.trainingPuzzlesQuery.data ?? [])
        .filter((trainingPuzzle) => trainingPuzzle['@id'] !== deletedTrainingPuzzleIri)
        .sort((left, right) => left.position - right.position);

      for (const [position, trainingPuzzle] of remainingTrainingPuzzles.entries()) {
        if (trainingPuzzle.position === position) {
          continue;
        }

        await updateTrainingPuzzlePosition(trainingPuzzle['@id'], position, session.token);
      }

      await invalidateTrainingData();
    },
  });

  const moveTrainingPuzzleMutation = useMutation({
    mutationFn: async ({
      direction,
      trainingPuzzleIri,
    }: {
      direction: 'down' | 'up';
      trainingPuzzleIri: string;
    }) => {
      if (queries.puzzleListIsLocked) {
        throw new Error('La liste de puzzles est verrouillee car un cycle existe deja.');
      }

      const sortedTrainingPuzzles = [...(queries.trainingPuzzlesQuery.data ?? [])].sort(
        (left, right) => left.position - right.position,
      );
      const currentIndex = sortedTrainingPuzzles.findIndex(
        (trainingPuzzle) => trainingPuzzle['@id'] === trainingPuzzleIri,
      );
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const currentTrainingPuzzle = sortedTrainingPuzzles[currentIndex];
      const targetTrainingPuzzle = sortedTrainingPuzzles[targetIndex];

      if (!currentTrainingPuzzle || !targetTrainingPuzzle) {
        return;
      }

      const temporaryPosition = getNextTrainingPuzzlePosition(sortedTrainingPuzzles);

      await updateTrainingPuzzlePosition(currentTrainingPuzzle['@id'], temporaryPosition, session.token);
      await updateTrainingPuzzlePosition(targetTrainingPuzzle['@id'], currentTrainingPuzzle.position, session.token);
      await updateTrainingPuzzlePosition(currentTrainingPuzzle['@id'], targetTrainingPuzzle.position, session.token);
    },
    onSuccess: async () => {
      await invalidateTrainingData();
    },
  });


  const ensureActiveTrainingSessionMutation = useMutation({
    mutationFn: async ({
      cycleIri,
      trainingIri,
    }: {
      cycleIri: string;
      trainingIri: string;
    }) =>
      apiRequest<TrainingSession>('/training_sessions', {
        method: 'POST',
        token: session.token,
        body: {
          training: trainingIri,
          cycle: cycleIri,
          note: 'Session restaurée automatiquement',
        },
      }),
    onSuccess: async (trainingSession) => {
      uiState.setActiveTrainingSessionIri(trainingSession['@id']);
      await queryClient.invalidateQueries({
        queryKey: ['training-overview', session.email, queries.effectiveSelectedTrainingIri],
      });
    },
  });

  const startCycleMutation = useMutation({
    mutationFn: async () => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant de demarrer un cycle.');
      }

      const trainingPuzzles = queries.trainingPuzzlesQuery.data ?? [];

      if (trainingPuzzles.length === 0) {
        throw new Error('Ajoute au moins un puzzle avant de demarrer un cycle.');
      }

      const existingActiveCycle = (queries.cyclesQuery.data ?? [])
        .filter((cycle) => cycle.status === 'active')
        .at(-1);

      if (existingActiveCycle) {
        const activeCyclePuzzles = (queries.trainingCyclePuzzlesQuery.data ?? []).filter(
          (cyclePuzzle) => cyclePuzzle.cycle === existingActiveCycle['@id'],
        );
        const existingTrainingPuzzleIris = new Set(
          activeCyclePuzzles.map((cyclePuzzle) => cyclePuzzle.trainingPuzzle),
        );
        let addedPendingCyclePuzzle = false;

        for (const trainingPuzzle of trainingPuzzles) {
          if (existingTrainingPuzzleIris.has(trainingPuzzle['@id'])) {
            continue;
          }

          addedPendingCyclePuzzle = true;
          await apiRequest<CyclePuzzle>('/cycle_puzzles', {
            method: 'POST',
            token: session.token,
            body: {
              cycle: existingActiveCycle['@id'],
              trainingPuzzle: trainingPuzzle['@id'],
              position: trainingPuzzle.position,
              status: 'pending',
            },
          });
        }

        const hasPendingCyclePuzzle = activeCyclePuzzles.some((cyclePuzzle) => cyclePuzzle.status === 'pending');
        const cycleCanBeCompleted = !addedPendingCyclePuzzle && !hasPendingCyclePuzzle;

        if (!cycleCanBeCompleted) {
          const existingTrainingSession = (queries.trainingSessionsQuery.data ?? [])
            .filter((trainingSession) => trainingSession.cycle === existingActiveCycle['@id'])
            .at(-1);

          if (existingTrainingSession) {
            return { cycle: existingActiveCycle, trainingSession: existingTrainingSession };
          }

          const trainingSession = await apiRequest<TrainingSession>('/training_sessions', {
            method: 'POST',
            token: session.token,
            body: {
              training: queries.effectiveSelectedTrainingIri,
              cycle: existingActiveCycle['@id'],
              note: 'Session du cycle ' + String(existingActiveCycle.number),
            },
          });

          return { cycle: existingActiveCycle, trainingSession };
        }

        await apiRequest<Cycle>(apiPathFromIri(existingActiveCycle['@id']), {
          method: 'PATCH',
          token: session.token,
          contentType: 'application/merge-patch+json',
          body: {
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        });
      }

      const nextCycleNumber =
        (queries.cyclesQuery.data ?? []).reduce((highest, cycle) => Math.max(highest, cycle.number), 0) + 1;

      const cycle = await apiRequest<Cycle>('/cycles', {
        method: 'POST',
        token: session.token,
        body: {
          training: queries.effectiveSelectedTrainingIri,
          number: nextCycleNumber,
          status: 'active',
          startedAt: new Date().toISOString(),
        },
      });

      for (const trainingPuzzle of trainingPuzzles) {
        await apiRequest<CyclePuzzle>('/cycle_puzzles', {
          method: 'POST',
          token: session.token,
          body: {
            cycle: cycle['@id'],
            trainingPuzzle: trainingPuzzle['@id'],
            position: trainingPuzzle.position,
            status: 'pending',
          },
        });
      }

      const trainingSession = await apiRequest<TrainingSession>('/training_sessions', {
        method: 'POST',
        token: session.token,
        body: {
          training: queries.effectiveSelectedTrainingIri,
          cycle: cycle['@id'],
          note: `Session du cycle ${nextCycleNumber}`,
        },
      });

      return { cycle, trainingSession };
    },
    onSuccess: async ({ cycle, trainingSession }) => {
      uiState.setActiveCycleIri(cycle['@id']);
      uiState.setActiveTrainingSessionIri(trainingSession['@id']);
      uiState.setSelectedTrainingPuzzleIri(null);
      uiState.setSavedCyclePuzzleIris(new Set());
      uiState.setFailedCyclePuzzleIris(new Set());
      uiState.setActiveView('solver');
      await invalidateTrainingData();
    },
  });

  const saveCyclePuzzleProgressMutation = useMutation({
    mutationFn: async (value: SolverAttemptSyncInput) => {
      const trainingIri = queries.effectiveSelectedTrainingIri;

      if (trainingIri) {
        upsertPendingSolverAttempt({
          attemptNumber: value.attemptNumber,
          clientRequestId: value.clientRequestId ?? createSolverAttemptClientRequestId(),
          cyclePuzzleDurationMilliseconds: value.cyclePuzzleDurationMilliseconds,
          cyclePuzzleIri: value.cyclePuzzle['@id'],
          durationMilliseconds: value.durationMilliseconds,
          mistakesCount: value.mistakesCount,
          playedMoves: value.playedMoves,
          status: value.status,
          trainingIri,
          trainingSession: value.trainingSession,
        });
      }

      return apiRequest<Attempt>('/attempts', {
        method: 'POST',
        token: session.token,
        body: {
          attemptNumber: value.attemptNumber,
          clientRequestId: value.clientRequestId,
          cyclePuzzle: value.cyclePuzzle['@id'],
          durationMilliseconds: value.durationMilliseconds,
          mistakesCount: value.mistakesCount,
          playedMoves: value.playedMoves,
          status: value.status,
          trainingSession: value.trainingSession,
        },
        keepalive: value.keepalive,
      });
    },
    onMutate: (value) => {
      updateCyclePuzzleOverviewCache(queries.effectiveSelectedTrainingIri, value.cyclePuzzle['@id'], buildOptimisticCyclePuzzlePatch(value.cyclePuzzle, value));
    },
    onSuccess: async (attempt, value) => {
      removePendingSolverAttempt(value.clientRequestId ?? attempt.clientRequestId ?? '');
      await invalidateTrainingData();
    },
  });

  const markCyclePuzzleFailedMutation = useMutation({
    mutationFn: async (cyclePuzzleIri: string) =>
      apiRequest<CyclePuzzle>(apiPathFromIri(cyclePuzzleIri), {
        method: 'PATCH',
        token: session.token,
        contentType: 'application/merge-patch+json',
        body: {
          status: 'failed',
        },
      }),
    onMutate: (cyclePuzzleIri) => {
      uiState.setFailedCyclePuzzleIris((current) => new Set(current).add(cyclePuzzleIri));
      updateCyclePuzzleOverviewCache(queries.effectiveSelectedTrainingIri, cyclePuzzleIri, {
        status: 'failed',
      });
    },
    onError: (_error, cyclePuzzleIri) => {
      uiState.setFailedCyclePuzzleIris((current) => {
        const next = new Set(current);
        next.delete(cyclePuzzleIri);

        return next;
      });
    },
    onSuccess: async () => {
      await invalidateTrainingData();
    },
  });

  const recordAttemptMutation = useMutation({
    mutationFn: async (value: SolverAttemptSyncInput) => {
      const trainingIri = queries.effectiveSelectedTrainingIri;

      if (trainingIri) {
        upsertPendingSolverAttempt({
          attemptNumber: value.attemptNumber,
          clientRequestId: value.clientRequestId ?? createSolverAttemptClientRequestId(),
          cyclePuzzleDurationMilliseconds: value.cyclePuzzleDurationMilliseconds,
          cyclePuzzleIri: value.cyclePuzzle['@id'],
          durationMilliseconds: value.durationMilliseconds,
          mistakesCount: value.mistakesCount,
          playedMoves: value.playedMoves,
          status: value.status,
          trainingIri,
          trainingSession: value.trainingSession,
        });
      }

      return apiRequest<Attempt>('/attempts', {
        method: 'POST',
        token: session.token,
        body: {
          attemptNumber: value.attemptNumber,
          clientRequestId: value.clientRequestId,
          cyclePuzzle: value.cyclePuzzle['@id'],
          durationMilliseconds: value.durationMilliseconds,
          mistakesCount: value.mistakesCount,
          playedMoves: value.playedMoves,
          status: value.status,
          trainingSession: value.trainingSession,
        },
      });
    },
    onMutate: (value) => {
      const patch = buildOptimisticCyclePuzzlePatch(value.cyclePuzzle, value);
      updateCyclePuzzleOverviewCache(queries.effectiveSelectedTrainingIri, value.cyclePuzzle['@id'], patch);

      if (patch.status === 'solved' || Boolean(patch.hasSolvedAttempt)) {
        uiState.setSavedCyclePuzzleIris((current) => new Set(current).add(value.cyclePuzzle['@id']));
      }

      if (patch.status === 'failed') {
        uiState.setFailedCyclePuzzleIris((current) => new Set(current).add(value.cyclePuzzle['@id']));
      }
    },
    onSuccess: async (attempt, value) => {
      removePendingSolverAttempt(value.clientRequestId ?? attempt.clientRequestId ?? '');
      await invalidateTrainingData();
    },
  });


  useEffect(() => {
    if (!queries.effectiveSelectedTrainingIri || !queries.effectiveActiveCycleIri) {
      ensuredTrainingSessionCycleIriRef.current = null;
      return;
    }

    if (queries.effectiveActiveTrainingSessionIri) {
      ensuredTrainingSessionCycleIriRef.current = queries.effectiveActiveCycleIri;
      return;
    }

    if (ensuredTrainingSessionCycleIriRef.current === queries.effectiveActiveCycleIri || ensureActiveTrainingSessionMutation.isPending) {
      return;
    }

    ensuredTrainingSessionCycleIriRef.current = queries.effectiveActiveCycleIri;
    ensureActiveTrainingSessionMutation.mutate({
      cycleIri: queries.effectiveActiveCycleIri,
      trainingIri: queries.effectiveSelectedTrainingIri,
    });
  }, [
    ensureActiveTrainingSessionMutation,
    queries.effectiveActiveCycleIri,
    queries.effectiveActiveTrainingSessionIri,
    queries.effectiveSelectedTrainingIri,
  ]);

  useEffect(() => {
    void flushPendingSolverPersistence();
  }, [
    queries.effectiveSelectedTrainingIri,
    queries.effectiveActiveTrainingSessionIri,
    queries.trainingCyclePuzzlesQuery.data?.length,
  ]);

  useEffect(() => {
    function flushPending() {
      void flushPendingSolverPersistence();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        flushPending();
      }
    }

    window.addEventListener('online', flushPending);
    window.addEventListener('focus', flushPending);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', flushPending);
      window.removeEventListener('focus', flushPending);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queries.effectiveSelectedTrainingIri, queries.trainingCyclePuzzlesQuery.data?.length]);

  function openTraining(trainingIri: string, view: View = 'detail') {
    const training = (queries.trainingsQuery.data ?? []).find((item) => item['@id'] === trainingIri) ?? null;
    uiState.setSelectedTrainingIri(trainingIri);
    uiState.setSelectedTrainingPuzzleIri(null);
    uiState.setActiveCycleIri(null);
    uiState.setActiveTrainingSessionIri(null);
    uiState.setSavedCyclePuzzleIris(new Set());
    uiState.setFailedCyclePuzzleIris(new Set());
    if (view === 'edit') {
      hydrateTrainingDraft(training);
    } else if (view === 'create') {
      resetTrainingDraft();
    }
    uiState.setActiveView(view);
  }

  return {
    createPuzzleMutation,
    createTrainingMutation,
    hydrateTrainingDraft,
    resetTrainingDraft,
    deleteTrainingMutation,
    ensureActiveTrainingSessionMutation,
    deleteTrainingPuzzleMutation,
    analyzeCsvMutation,
    importCsvMutation,
    importLichessMutation,
    estimateLichessAvailability,
    moveTrainingPuzzleMutation,
    openTraining,
    markCyclePuzzleFailedMutation,
    recordAttemptMutation,
    recordSolverAttempt,
    saveCyclePuzzleProgressMutation,
    persistSolverProgress,
    saveUserSettingsMutation,
    updateTrainingMutation,
    startCycleMutation,
  };
}
