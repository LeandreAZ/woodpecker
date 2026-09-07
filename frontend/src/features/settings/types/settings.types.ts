export type UserSettingsOverview = {
  user: {
    '@id': string | null;
    id: number | null;
    email: string;
    roles: string[];
    createdAt: string | null;
  };
  profile: {
    pseudonym: string;
    displayName?: string;
    avatarUrl: string | null;
  };
  appearance: {
    language: import('../../solver/services/chessboardPreferences').SupportedLanguage;
    theme: import('../../solver/services/chessboardPreferences').SupportedTheme;
  };
  board: {
    lightSquareColor: string;
    darkSquareColor: string;
    themeLabel: string;
  };
  solverPreferences: {
    showLegalMoves: boolean;
    showCoordinates: boolean;
    animateMoves: boolean;
    showRightClickTargets: boolean;
  };
  security: {
    lastLoginAt: string | null;
    lastLogoutAt: string | null;
    lastLogoutReason: string | null;
  };
  workspace: {
    trainingCount: number;
    activeTrainingCount: number;
    archivedTrainingCount: number;
    puzzleCount: number;
    latestTrainingName: string | null;
  };
};
