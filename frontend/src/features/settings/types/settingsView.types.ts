import type { UserSettingsOverview } from '../types/settings.types';

export type SavePayload = {
  appearance: UserSettingsOverview['appearance'];
  board: Pick<UserSettingsOverview['board'], 'darkSquareColor' | 'lightSquareColor'>;
  profile: { pseudonym: string };
  solverPreferences: UserSettingsOverview['solverPreferences'];
};

export type TrainingsSettingsViewProps = {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (value: SavePayload) => Promise<UserSettingsOverview>;
  saveErrorMessage?: string;
  settingsOverview: UserSettingsOverview | null;
};

export type DraftSettings = {
  appearance: UserSettingsOverview['appearance'];
  board: Pick<UserSettingsOverview['board'], 'darkSquareColor' | 'lightSquareColor'>;
  profile: {
    avatarUrl: string | null;
    pseudonym: string;
  };
  solverPreferences: UserSettingsOverview['solverPreferences'];
};

export type FeedbackTone = 'error' | 'info' | 'success';

export type ModalState = 'board' | 'delete' | 'email' | 'password' | null;
