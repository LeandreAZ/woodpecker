import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/api/client';
import type { AuthSession } from '../../auth/services/authStorage';
import type { View } from '../../trainings/types/training.types';
import { getPreviewHistoryOverview } from '../../trainings/mocks/previewData';
import type { HistoryOverview } from '../types/history.types';

export function useHistoryOverviewQuery(session: AuthSession, uiState: { activeView: View }, previewMode: boolean) {
  return useQuery({
    queryKey: ['history-overview', session.email],
    enabled: uiState.activeView === 'history',
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewHistoryOverview())
        : apiRequest<HistoryOverview>('/history/overview', { token: session.token }),
  });
}
