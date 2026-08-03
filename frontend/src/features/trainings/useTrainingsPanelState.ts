import type { AuthSession } from '../auth/authStorage';
import { useTrainingsPanelActions } from './useTrainingsPanelActions';
import { useTrainingsPanelQueries } from './useTrainingsPanelQueries';
import { useTrainingsPanelUiState } from './useTrainingsPanelUiState';

export function useTrainingsPanelState(session: AuthSession) {
  const uiState = useTrainingsPanelUiState();
  const queries = useTrainingsPanelQueries(session, uiState);
  const actions = useTrainingsPanelActions(session, uiState, queries);

  return {
    ...uiState,
    ...queries,
    ...actions,
  };
}
