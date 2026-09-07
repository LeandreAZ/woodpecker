import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/api/client';
import type { SupportedLanguage, SupportedTheme } from '../../solver/services/chessboardPreferences';
import type { UserSettingsOverview } from '../types/settings.types';
import type { ActionsContext } from '../../trainings/actions/actionTypes';

export function useSettingsActions({ session, queryClient }: ActionsContext) {
  const saveUserSettingsMutation = useMutation<UserSettingsOverview, Error, {
    appearance: { language: SupportedLanguage; theme: SupportedTheme };
    board: { darkSquareColor: string; lightSquareColor: string };
    profile: { pseudonym: string };
    solverPreferences: {
      animateMoves: boolean;
      showCoordinates: boolean;
      showLegalMoves: boolean;
      showRightClickTargets: boolean;
    };
  }>({
    mutationFn: async (value) =>
      apiRequest<UserSettingsOverview>('/users/me/settings', {
        method: 'PUT',
        token: session.token,
        body: value,
      }),
    onSuccess: async (payload) => {
      queryClient.setQueryData(['user-settings-overview', session.email], payload);
      await queryClient.invalidateQueries({ queryKey: ['user-settings-overview', session.email] });
    },
  });
  return { saveUserSettingsMutation };
}
