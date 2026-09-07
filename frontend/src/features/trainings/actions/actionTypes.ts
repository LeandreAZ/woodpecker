import type { QueryClient } from '@tanstack/react-query';
import type { AuthSession } from '../../auth/services/authStorage';
import type { useTrainingsPanelUiState } from '../hooks/useTrainingsPanelUiState';
import type { useTrainingsPanelQueries } from '../hooks/useTrainingsPanelQueries';

export type ActionsContext = {
  session: AuthSession;
  uiState: ReturnType<typeof useTrainingsPanelUiState>;
  queries: ReturnType<typeof useTrainingsPanelQueries>;
  queryClient: QueryClient;
  invalidateTrainingData: (trainingIri?: string | null) => Promise<void>;
};
