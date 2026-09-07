import { useQueryClient } from '@tanstack/react-query';
import type { AuthSession } from '../../auth/services/authStorage';
import type { useTrainingsPanelQueries } from './useTrainingsPanelQueries';
import type { useTrainingsPanelUiState } from './useTrainingsPanelUiState';
import { useTrainingActions } from '../actions/useTrainingActions';
import { useTrainingPuzzleActions } from '../actions/useTrainingPuzzleActions';
import { useSettingsActions } from '../../settings/hooks/useSettingsActions';
import { useImportActions } from '../../import/hooks/useImportActions';
import { useCycleActions } from '../actions/useCycleActions';
import { useSolverActions } from '../../solver/hooks/useSolverActions';

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

  const context = { session, uiState, queries, queryClient, invalidateTrainingData };
  const trainingActions = useTrainingActions(context);
  const trainingPuzzleActions = useTrainingPuzzleActions(context);
  const settingsActions = useSettingsActions(context);
  const importActions = useImportActions(context);
  const cycleActions = useCycleActions(context);
  const solverActions = useSolverActions(context);
  return {
    ...trainingActions,
    ...trainingPuzzleActions,
    ...settingsActions,
    ...importActions,
    ...cycleActions,
    ...solverActions,
  };
}
