import type { AuthSession } from '../auth/authStorage';
import type { View } from './trainingsTypes';
import { useTrainingsPanelActions } from './useTrainingsPanelActions';
import { useTrainingsPanelQueries } from './useTrainingsPanelQueries';
import { useTrainingsPanelUiState } from './useTrainingsPanelUiState';

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
