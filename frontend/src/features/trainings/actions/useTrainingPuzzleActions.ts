import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/api/client';
import { parseOptionalRating, validatePuzzleInput } from '../../solver/domain/puzzleValidation';
import { apiPathFromIri, getNextTrainingPuzzlePosition, splitList, updateTrainingPuzzlePosition } from '../utils/training.utils';
import type { Puzzle, TrainingPuzzle } from '../types/training.types';
import type { ActionsContext } from './actionTypes';

export function useTrainingPuzzleActions({ session, uiState, queries, invalidateTrainingData }: ActionsContext) {
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


  return { createPuzzleMutation, deleteTrainingPuzzleMutation, moveTrainingPuzzleMutation };
}
