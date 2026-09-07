import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/api/client';
import type { AuthSession } from '../../auth/services/authStorage';
import type { View } from '../../trainings/types/training.types';
import { getPreviewUserSettingsOverview } from '../../trainings/mocks/previewData';
import type { UserSettingsOverview } from '../types/settings.types';

export function useUserSettingsOverviewQuery(session: AuthSession, uiState: { activeView: View }, previewMode: boolean) {
  return useQuery({
    queryKey: ['user-settings-overview', session.email],
    staleTime: 60_000,
    queryFn: () =>
      previewMode
        ? Promise.resolve(getPreviewUserSettingsOverview())
        : apiRequest<UserSettingsOverview>('/users/me/overview', { token: session.token }),
  });
}
