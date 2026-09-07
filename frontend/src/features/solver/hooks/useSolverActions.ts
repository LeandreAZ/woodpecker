import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/api/client';
import type { PuzzleCompletionResult } from '../components/PuzzleSolver';
import { apiPathFromIri } from '../../trainings/utils/training.utils';
import type { Attempt, CyclePuzzle, TrainingOverview } from '../../trainings/types/training.types';
import { createSolverAttemptClientRequestId, listPendingSolverAttempts, removePendingSolverAttempt, upsertPendingSolverAttempt } from '../services/solverPersistence';
import type { ActionsContext } from '../../trainings/actions/actionTypes';

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

export function useSolverActions({ session, uiState, queries, queryClient, invalidateTrainingData }: ActionsContext) {
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

  return { saveCyclePuzzleProgressMutation, markCyclePuzzleFailedMutation, recordAttemptMutation, recordSolverAttempt, persistSolverProgress };
}
