import {
  DEFAULT_DARK_SQUARE_COLOR,
  DEFAULT_LIGHT_SQUARE_COLOR,
  type SupportedTheme
} from '../../solver/services/chessboardPreferences';
import type { UserSettingsOverview } from '../types/settings.types';
import type { DraftSettings } from '../types/settingsView.types';

export const THEME_STORAGE_KEY = 'woodpecker-theme';

export function createDraft(settingsOverview: UserSettingsOverview | null): DraftSettings {
  return {
    profile: {
      avatarUrl: settingsOverview?.profile.avatarUrl ?? null,
      pseudonym: (settingsOverview?.profile as { pseudonym?: string; displayName?: string } | undefined)?.pseudonym
        ?? settingsOverview?.profile.displayName
        ?? '',
    },
    appearance: {
      language: settingsOverview?.appearance.language ?? 'fr',
      theme: settingsOverview?.appearance.theme ?? 'dark',
    },
    board: {
      lightSquareColor: settingsOverview?.board.lightSquareColor ?? DEFAULT_LIGHT_SQUARE_COLOR,
      darkSquareColor: settingsOverview?.board.darkSquareColor ?? DEFAULT_DARK_SQUARE_COLOR,
    },
    solverPreferences: {
      showLegalMoves: settingsOverview?.solverPreferences.showLegalMoves ?? true,
      showCoordinates: settingsOverview?.solverPreferences.showCoordinates ?? true,
      animateMoves: settingsOverview?.solverPreferences.animateMoves ?? true,
      showRightClickTargets: settingsOverview?.solverPreferences.showRightClickTargets ?? true,
    },
  };
}

export function applyTheme(theme: SupportedTheme) {
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
