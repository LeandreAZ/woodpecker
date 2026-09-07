import { notify } from '../../../shared/notifications/notifications';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/api/client';
import { DEFAULT_TRAINING_BRANDING, normalizeTrainingBackgroundColor, normalizeTrainingIconColor, normalizeTrainingPiece } from '../components/identity/TrainingBranding';
import { apiPathFromIri } from '../utils/training.utils';
import type { Training, View } from '../types/training.types';
import type { ActionsContext } from './actionTypes';

export function useTrainingActions({ session, uiState, queries, queryClient, invalidateTrainingData }: ActionsContext) {
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
      notify('Entraînement créé.');
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
      notify('Entraînement enregistré.');
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
      notify('Entraînement supprimé.');
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

  return { createTrainingMutation, updateTrainingMutation, deleteTrainingMutation, hydrateTrainingDraft, resetTrainingDraft, openTraining };
}
