import type { AuthSession } from '../../auth/services/authStorage';
import type { View } from '../types/training.types';
import { useTrainingsPanelActions } from '../hooks/useTrainingsPanelActions';
import { useTrainingsPanelQueries } from '../hooks/useTrainingsPanelQueries';
import { useTrainingsPanelUiState } from '../hooks/useTrainingsPanelUiState';

export function useTrainingsPanelState(session: AuthSession, initialView: View) {
  const uiState = useTrainingsPanelUiState(initialView);
  const queries = useTrainingsPanelQueries(session, uiState);
  const actions = useTrainingsPanelActions(session, uiState, queries);

  return {
    ...uiState,
    ...queries,
    ...actions,
  };
}
