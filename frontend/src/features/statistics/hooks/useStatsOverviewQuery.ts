import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/api/client';
import type { AuthSession } from '../../auth/services/authStorage';
import type { View } from '../../trainings/types/training.types';
import { getPreviewStatsOverview } from '../../trainings/mocks/previewData';
import type { StatsOverview } from '../types/statistics.types';

export function useStatsOverviewQuery(session: AuthSession, uiState: { activeView: View }, previewMode: boolean) {
  return useQuery({
    queryKey: ['stats-overview', session.email],
    enabled: uiState.activeView === 'stats' || uiState.activeView === 'dashboard',
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewStatsOverview())
        : apiRequest<StatsOverview>('/stats/overview', { token: session.token }),
  });
}
