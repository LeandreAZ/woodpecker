export type CollectionView = {
  '@id'?: string;
  first?: string;
  last?: string;
  next?: string;
  previous?: string;
  'hydra:first'?: string;
  'hydra:last'?: string;
  'hydra:next'?: string;
  'hydra:previous'?: string;
};

export type ApiCollection<Item> = {
  member?: Item[];
  totalItems?: number;
  view?: CollectionView;
  'hydra:member'?: Item[];
  'hydra:totalItems'?: number;
  'hydra:view'?: CollectionView;
};
import type { PuzzleCsvRow } from './csvImport';

export type View =
  | 'dashboard'
  | 'create'
  | 'edit'
  | 'detail'
  | 'import'
  | 'solver'
  | 'stats'
  | 'history'
  | 'settings';

export type Training = {
  '@id': string;
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  iconBackgroundColor?: string | null;
  iconColor?: string | null;
  logo?: string | null;
  mistakeLimit?: number | null;
  status: string;
  createdAt: string;
};

export type TrainingReference = {
  '@id': string;
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  iconBackgroundColor?: string | null;
  iconColor?: string | null;
  logo?: string | null;
  status: string;
};

export type UserReference = {
  '@id': string;
  id: number;
  email: string;
  roles: string[];
  createdAt?: string | null;
};

export type DailyActivityPoint = {
  attemptCount: number;
  date: string;
  durationMilliseconds: number;
  handledPuzzleCount: number;
  successfulAttemptCount: number;
};

export type Puzzle = {
  '@id': string;
  id: number;
  fen?: string | null;
  solution: string[];
  themes: string[];
  rating?: number | null;
};

export type TrainingPuzzle = {
  '@id': string;
  id: number;
  training: string;
  puzzle: Puzzle | string | null;
  position: number;
  personalNote?: string | null;
};

export type Cycle = {
  '@id': string;
  id: number;
  training: string;
  number: number;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type AttemptStatus = 'in_progress' | 'failed' | 'solved';

export type CyclePuzzle = {
  '@id': string;
  id: number;
  cycle: string;
  trainingPuzzle: string;
  position: number;
  status: string;
  attemptCount?: number;
  durationMilliseconds?: number;
  completedAt?: string | null;
  attempts?: Attempt[];
  activeAttempt?: Attempt | null;
  completedAttemptCount?: number;
  completedDurationMilliseconds?: number;
  hasSolvedAttempt?: boolean;
};

export type TrainingSession = {
  '@id': string;
  id: number;
  training: string;
  cycle?: string | null;
  startedAt: string;
};

export type Attempt = {
  '@id': string;
  id: number;
  clientRequestId?: string | null;
  cyclePuzzle: string;
  trainingSession: string;
  attemptNumber: number;
  status: AttemptStatus;
  playedMoves: string[];
  successful: boolean;
  mistakesCount: number;
  durationMilliseconds: number;
  startedAt?: string | null;
  completedAt?: string | null;
  attemptedAt?: string | null;
};

export type TrainingOverview = {
  trainingPuzzles: TrainingPuzzle[];
  cycles: Cycle[];
  cyclePuzzles: CyclePuzzle[];
  trainingSessions: TrainingSession[];
};

export type TrainingCycleSummary = {
  attemptCount: number;
  averageAttempts?: number;
  completedPuzzleCount?: number;
  cycle: Cycle;
  durationMilliseconds?: number;
  failed: number;
  pending: number;
  progressPercent: number;
  puzzlesWithCompletedAttemptsCount?: number;
  rescuedCount?: number;
  solved: number;
  successRate?: number;
  total: number;
  unresolvedCount?: number;
};

export type TrainingAttemptSummary = {
  '@id': string;
  id: number;
  successful: boolean;
  mistakesCount: number;
  durationMilliseconds: number;
  attemptedAt: string;
  cycleNumber?: number | null;
  trainingPuzzlePosition?: number | null;
};

export type TrainingSummary = {
  puzzleCount: number;
  ratedPuzzleCount: number;
  themedPuzzleCount: number;
  notedPuzzleCount: number;
  attemptCount: number;
  solvedAttemptCount: number;
  averageMistakes: number;
  dailyActivity?: DailyActivityPoint[];
  latestCycleSummary: TrainingCycleSummary | null;
  cycleSummaries: TrainingCycleSummary[];
  attemptCountDistribution?: {
    oneAttemptCount: number;
    twoAttemptCount: number;
    threeAttemptCount: number;
    fourPlusAttemptCount: number;
    resolvedPuzzleCount: number;
  };
  latestAttempts: TrainingAttemptSummary[];
};

export type TrainingAnalytics = {
  training: Training;
  performance: {
    attemptCount: number;
    solvedAttemptCount: number;
    failedAttemptCount: number;
    successRate: number;
    averageMistakes: number;
    averageDurationSeconds: number;
    latestAttemptedAt?: string | null;
  };
  puzzleReadiness: {
    puzzleCount: number;
    ratedPuzzleCount: number;
    themedPuzzleCount: number;
    notedPuzzleCount: number;
  };
  progressionSnapshot: {
    activeCycleCount: number;
    completedCycleCount: number;
    resumableCycle: boolean;
    latestCycleProgressPercent: number;
    bestCycleProgressPercent: number;
  };
  cycleTimeline: TrainingCycleSummary[];
};

export type TrainingDashboardSummary = {
  training: Training;
  puzzleCount: number;
  attemptCount: number;
  averageAttempts?: number;
  activeDays?: number;
  completedAttemptCount?: number;
  completedPuzzleCount?: number;
  dailyActivity?: DailyActivityPoint[];
  durationMilliseconds?: number;
  handledPuzzleCount?: number;
  progressPercent: number;
  progressDelta?: number;
  solvedCount: number;
  successfulAttemptCount?: number;
  successRate?: number;
  failedCount: number;
  pendingCount: number;
  rescuedCount?: number;
  resolvedPuzzleCount?: number;
  unresolvedCount?: number;
  latestCycleNumber?: number | null;
  latestCycleStatus?: string | null;
  hasResumableCycle: boolean;
  latestAttemptedAt?: string | null;
  descriptionReady: boolean;
  puzzlesWithCompletedAttemptsCount?: number;
};

export type StatsOverview = {
  trainingCount: number;
  puzzleCount: number;
  attemptCount: number;
  completedAttemptCount?: number;
  averageAttempts?: number;
  progressPercent?: number;
  totalDurationMilliseconds?: number;
  successfulAttemptCount: number;
  successRate: number;
  averageMistakes: number;
  activeCycleCount: number;
  completedCycleCount: number;
  resumableTrainingCount: number;
  solvedCyclePuzzleCount: number;
  failedCyclePuzzleCount: number;
  pendingCyclePuzzleCount: number;
  rescuedCyclePuzzleCount?: number;
  unresolvedCyclePuzzleCount?: number;
  latestAttemptedAt?: string | null;
  trainingBreakdown: TrainingDashboardSummary[];
};

export type HistoryItemStatus = 'solved' | 'failed';
export type HistoryActivityType = 'attempt' | 'connection' | 'disconnection';

export type HistoryTimelineItem = {
  '@id': string;
  id: number;
  activityType: HistoryActivityType;
  training: TrainingReference | null;
  cycle: Pick<Cycle, '@id' | 'id' | 'number' | 'status'> | null;
  cyclePuzzle: {
    '@id': string;
    id: number;
    position: number;
    status: string;
  } | null;
  label: string;
  detail: string;
  status: HistoryItemStatus | null;
  statusLabel: string | null;
  attemptNumber?: number | null;
  durationMilliseconds: number;
  occurredAt: string;
};

export type HistoryOverview = {
  availableTrainings: TrainingReference[];
  items: HistoryTimelineItem[];
  latestOccurredAt?: string | null;
  supportsConnectionHistory: boolean;
  totalItems: number;
};

export type DetailedAttemptHistoryItem = {
  '@id': string;
  id: number;
  successful: boolean;
  mistakesCount: number;
  durationMilliseconds: number;
  attemptedAt: string;
  trainingSession?: string | null;
  cyclePuzzle?: string | null;
};

export type TrainingAttemptHistory = {
  training: TrainingReference;
  attempts: DetailedAttemptHistoryItem[];
};

export type DetailedCycleHistoryItem = {
  cycle: Cycle;
  solved: number;
  failed: number;
  pending: number;
  total: number;
  progressPercent: number;
  attemptCount: number;
  averageAttempts?: number;
  durationMilliseconds?: number;
};

export type TrainingCycleHistory = {
  training: TrainingReference;
  cycles: DetailedCycleHistoryItem[];
};

export type UserSettingsOverview = {
  user: {
    '@id': string | null;
    id: number | null;
    email: string;
    roles: string[];
    createdAt: string | null;
  };
  profile: {
    displayName: string;
    avatarUrl: string | null;
  };
  appearance: {
    language: import('./chessboardPreferences').SupportedLanguage;
    theme: import('./chessboardPreferences').SupportedTheme;
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
export type CycleStats = {
  total: number;
  solved: number;
  failed: number;
  pending: number;
  progressPercent: number;
};

export type ParsedCsvPayload = {
  errors: string[];
  fileName: string;
  rows: PuzzleCsvRow[];
};





