import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/api/client';
import { apiPathFromIri } from '../utils/training.utils';
import type { Cycle, CyclePuzzle, TrainingSession } from '../types/training.types';
import type { ActionsContext } from './actionTypes';

export function useCycleActions({ session, uiState, queries, queryClient, invalidateTrainingData }: ActionsContext) {
  const ensuredTrainingSessionCycleIriRef = useRef<string | null>(null);
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

  return { ensureActiveTrainingSessionMutation, startCycleMutation };
}
