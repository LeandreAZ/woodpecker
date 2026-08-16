import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/client';
import type { AuthSession } from '../auth/authStorage';
import type { PuzzleCompletionResult } from './PuzzleSolver';
import { parseOptionalRating, validatePuzzleInput } from './puzzleValidation';
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
  TrainingSession,
  View,
} from './trainingsTypes';
import type { useTrainingsPanelQueries } from './useTrainingsPanelQueries';
import type { useTrainingsPanelUiState } from './useTrainingsPanelUiState';

type UiState = ReturnType<typeof useTrainingsPanelUiState>;
type Queries = ReturnType<typeof useTrainingsPanelQueries>;

export function useTrainingsPanelActions(
  session: AuthSession,
  uiState: UiState,
  queries: Queries,
) {
  const queryClient = useQueryClient();

  async function invalidateTrainingData(trainingIri = queries.effectiveSelectedTrainingIri) {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['training-overview', session.email, trainingIri],
      }),
      queryClient.invalidateQueries({
        queryKey: ['training-summary', session.email, trainingIri],
      }),
    ]);
  }

  const createTrainingMutation = useMutation({
    mutationFn: async () =>
      apiRequest<Training>('/trainings', {
        method: 'POST',
        token: session.token,
        body: {
          name: uiState.name.trim(),
          description: uiState.description.trim() || null,
          icon: uiState.icon,
        },
      }),
    onSuccess: async (training) => {
      uiState.setName('');
      uiState.setDescription('');
      uiState.setIcon('queen');
      uiState.setSelectedTrainingIri(training['@id']);
      uiState.setSelectedTrainingPuzzleIri(null);
      uiState.setMistakeLimitOverride(null);
      uiState.setActiveView('detail');
      await queryClient.invalidateQueries({ queryKey: ['trainings', session.email] });
      await invalidateTrainingData(training['@id']);
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
      ]);
    },
  });

  const updateMistakeLimitMutation = useMutation({
    mutationFn: async (nextMistakeLimit: number) => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant de regler la tolerance.');
      }

      return apiRequest<Training>(apiPathFromIri(queries.effectiveSelectedTrainingIri), {
        method: 'PATCH',
        token: session.token,
        contentType: 'application/merge-patch+json',
        body: {
          mistakeLimit: nextMistakeLimit,
        },
      });
    },
    onMutate: (nextMistakeLimit) => {
      uiState.setMistakeLimitOverride(nextMistakeLimit);
    },
    onError: () => {
      uiState.setMistakeLimitOverride(null);
    },
    onSuccess: async (training) => {
      uiState.setMistakeLimitOverride(training.mistakeLimit);
      await queryClient.invalidateQueries({ queryKey: ['trainings', session.email] });
      await invalidateTrainingData(training['@id']);
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

  const importCsvMutation = useMutation({
    mutationFn: async () => {
      if (!queries.effectiveSelectedTrainingIri) {
        throw new Error('Selectionne un entrainement avant d importer des puzzles.');
      }

      if (uiState.csvRows.length === 0) {
        throw new Error('Choisis un fichier CSV valide avant de lancer l import.');
      }

      let nextPosition = getNextTrainingPuzzlePosition(queries.trainingPuzzlesQuery.data ?? []);

      for (const row of uiState.csvRows) {
        const puzzle = await apiRequest<Puzzle>('/puzzles', {
          method: 'POST',
          token: session.token,
          body: {
            fen: row.fen,
            solution: row.solution,
            themes: row.themes,
            rating: row.rating,
          },
        });

        await apiRequest<TrainingPuzzle>('/training_puzzles', {
          method: 'POST',
          token: session.token,
          body: {
            training: queries.effectiveSelectedTrainingIri,
            puzzle: puzzle['@id'],
            position: nextPosition,
            personalNote: row.personalNote,
          },
        });

        nextPosition += 1;
      }

      return uiState.csvRows.length;
    },
    onSuccess: async () => {
      uiState.setCsvRows([]);
      uiState.setCsvErrors([]);
      uiState.setCsvFileName('');
      uiState.setActiveView('solver');
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

        for (const trainingPuzzle of trainingPuzzles) {
          if (existingTrainingPuzzleIris.has(trainingPuzzle['@id'])) {
            continue;
          }

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
            note: `Session du cycle ${existingActiveCycle.number}`,
          },
        });

        return { cycle: existingActiveCycle, trainingSession };
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

  const recordAttemptMutation = useMutation({
    mutationFn: async ({
      cyclePuzzle,
      result,
      successful,
      trainingSession,
    }: {
      cyclePuzzle: CyclePuzzle;
      result: PuzzleCompletionResult;
      successful: boolean;
      trainingSession: string;
    }) => {
      const attempt = await apiRequest<Attempt>('/attempts', {
        method: 'POST',
        token: session.token,
        body: {
          cyclePuzzle: cyclePuzzle['@id'],
          trainingSession,
          playedMoves: result.playedMoves,
          successful,
          mistakesCount: result.mistakesCount,
          durationMilliseconds: result.durationMilliseconds,
        },
      });

      await apiRequest<CyclePuzzle>(apiPathFromIri(cyclePuzzle['@id']), {
        method: 'PATCH',
        token: session.token,
        contentType: 'application/merge-patch+json',
        body: {
          status: successful ? 'solved' : 'failed',
        },
      });

      const updatedCyclePuzzles = (queries.cyclePuzzlesQuery.data ?? []).map((item) => {
        if (item['@id'] === cyclePuzzle['@id']) {
          return { ...item, status: successful ? 'solved' : 'failed' };
        }

        if (uiState.savedCyclePuzzleIris.has(item['@id'])) {
          return { ...item, status: 'solved' };
        }

        if (uiState.failedCyclePuzzleIris.has(item['@id'])) {
          return { ...item, status: 'failed' };
        }

        return item;
      });

      return {
        attempt,
        completedCycle:
          updatedCyclePuzzles.length > 0 &&
          updatedCyclePuzzles.every((item) => item.status !== 'pending'),
      };
    },
    onMutate: ({ cyclePuzzle, successful }) => {
      if (successful) {
        uiState.setSavedCyclePuzzleIris((current) => new Set(current).add(cyclePuzzle['@id']));
        uiState.setFailedCyclePuzzleIris((current) => {
          const next = new Set(current);
          next.delete(cyclePuzzle['@id']);

          return next;
        });
      } else {
        uiState.setFailedCyclePuzzleIris((current) => new Set(current).add(cyclePuzzle['@id']));
      }
    },
    onError: (_error, { cyclePuzzle, successful }) => {
      if (successful) {
        uiState.setSavedCyclePuzzleIris((current) => {
          const next = new Set(current);
          next.delete(cyclePuzzle['@id']);

          return next;
        });

        return;
      }

      uiState.setFailedCyclePuzzleIris((current) => {
        const next = new Set(current);
        next.delete(cyclePuzzle['@id']);

        return next;
      });
    },
    onSuccess: async ({ completedCycle }) => {
      await invalidateTrainingData();

      if (completedCycle) {
        uiState.setActiveView('detail');

        return;
      }

      uiState.setSelectedTrainingPuzzleIri(null);
    },
  });

  function openTraining(trainingIri: string, view: View = 'detail') {
    uiState.setSelectedTrainingIri(trainingIri);
    uiState.setSelectedTrainingPuzzleIri(null);
    uiState.setActiveCycleIri(null);
    uiState.setActiveTrainingSessionIri(null);
    uiState.setSavedCyclePuzzleIris(new Set());
    uiState.setFailedCyclePuzzleIris(new Set());
    uiState.setMistakeLimitOverride(null);
    uiState.setActiveView(view);
  }

  return {
    createPuzzleMutation,
    createTrainingMutation,
    deleteTrainingMutation,
    deleteTrainingPuzzleMutation,
    importCsvMutation,
    moveTrainingPuzzleMutation,
    openTraining,
    recordAttemptMutation,
    startCycleMutation,
    updateMistakeLimitMutation,
  };
}

