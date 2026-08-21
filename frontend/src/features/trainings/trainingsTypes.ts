import type { PuzzleCsvRow } from './csvImport';

export type View =
  | 'dashboard'
  | 'create'
  | 'detail'
  | 'import'
  | 'solver'
  | 'stats'
  | 'history'
  | 'settings';

export const mistakeLimitOptions = [0, 1, 2, 3, 4, 5];

export type Training = {
  '@id': string;
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  logo?: string | null;
  mistakeLimit: number;
  status: string;
  createdAt: string;
};

export type TrainingReference = {
  '@id': string;
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
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

export type CyclePuzzle = {
  '@id': string;
  id: number;
  cycle: string;
  trainingPuzzle: string;
  position: number;
  status: string;
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
  cyclePuzzle: string;
  trainingSession: string;
  playedMoves: string[];
  successful: boolean;
  mistakesCount: number;
  durationMilliseconds: number;
  attemptedAt: string;
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
  cycle: Cycle;
  durationMilliseconds?: number;
  failed: number;
  pending: number;
  progressPercent: number;
  solved: number;
  successRate?: number;
  total: number;
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
  dailyActivity?: DailyActivityPoint[];
  durationMilliseconds?: number;
  progressPercent: number;
  progressDelta?: number;
  solvedCount: number;
  successfulAttemptCount?: number;
  successRate?: number;
  failedCount: number;
  pendingCount: number;
  latestCycleNumber?: number | null;
  latestCycleStatus?: string | null;
  hasResumableCycle: boolean;
  latestAttemptedAt?: string | null;
  descriptionReady: boolean;
};

export type StatsOverview = {
  trainingCount: number;
  puzzleCount: number;
  attemptCount: number;
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
  latestAttemptedAt?: string | null;
  trainingBreakdown: TrainingDashboardSummary[];
};

export type HistoryAttemptSummary = {
  '@id': string;
  id: number;
  training: TrainingReference;
  successful: boolean;
  mistakesCount: number;
  durationMilliseconds: number;
  attemptedAt: string;
  cycleNumber?: number | null;
  trainingPuzzlePosition?: number | null;
};

export type HistoryCycleSummary = {
  training: TrainingReference;
  cycle: Cycle;
  solved: number;
  failed: number;
  pending: number;
  total: number;
  progressPercent: number;
  attemptCount: number;
  hasResumableCycle: boolean;
};

export type HistoryOverview = {
  attemptCount: number;
  successfulAttemptCount: number;
  failedAttemptCount: number;
  cycleCount: number;
  activeCycleCount: number;
  completedCycleCount: number;
  latestAttemptedAt?: string | null;
  recentAttempts: HistoryAttemptSummary[];
  recentCycles: HistoryCycleSummary[];
};

export type DetailedAttemptHistoryItem = {
  '@id': string;
  id: number;
  successful: boolean;
  mistakesCount: number;
  durationMilliseconds: number;
  playedMoves: string[];
  attemptedAt?: string | null;
  cycle: {
    '@id': string | null;
    id: number | null;
    number: number | null;
    status: string | null;
  };
  cyclePuzzle: {
    '@id': string | null;
    id: number | null;
    position: number | null;
    status: string | null;
  };
  trainingPuzzle: {
    '@id': string | null;
    id: number | null;
    position: number | null;
    personalNote?: string | null;
  };
  puzzle: Puzzle | null;
};

export type TrainingAttemptHistory = {
  training: Training;
  attemptCount: number;
  successfulAttemptCount: number;
  failedAttemptCount: number;
  latestAttemptedAt?: string | null;
  attempts: DetailedAttemptHistoryItem[];
};

export type DetailedCycleHistoryItem = {
  cycle: Cycle & {
    targetDurationSeconds?: number | null;
  };
  solved: number;
  failed: number;
  pending: number;
  total: number;
  progressPercent: number;
  attemptCount: number;
  latestAttemptedAt?: string | null;
  hasResumableCycle: boolean;
  cyclePuzzles: Array<{
    '@id': string;
    id: number;
    position: number;
    status: string;
    completedAt?: string | null;
    trainingPuzzle: {
      '@id': string | null;
      id: number | null;
      position: number | null;
      personalNote?: string | null;
    } | null;
  }>;
};

export type TrainingCycleHistory = {
  training: Training;
  cycleCount: number;
  activeCycleCount: number;
  completedCycleCount: number;
  cycles: DetailedCycleHistoryItem[];
};

export type UserSettingsOverview = {
  user: UserReference;
  workspace: {
    trainingCount: number;
    activeTrainingCount: number;
    archivedTrainingCount: number;
    puzzleCount: number;
    latestTrainingName?: string | null;
  };
  preferencesPreview: {
    defaultMistakeLimit: number;
    lockTrainingAfterCycle: boolean;
    trackedSolverByDefault: boolean;
  };
  integrations: {
    lichessConnected: boolean;
    chessComConnected: boolean;
    exportReady: boolean;
  };
};

export type CycleStats = {
  failed: number;
  pending: number;
  progressPercent: number;
  solved: number;
  total: number;
};

export type ApiCollection<Item> = {
  member?: Item[];
  'hydra:member'?: Item[];
  view?: CollectionView;
  'hydra:view'?: CollectionView;
};

export type CollectionView = {
  next?: string;
  'hydra:next'?: string;
};

export type ImportPreview = {
  csvErrors: string[];
  csvFileName: string;
  csvRows: PuzzleCsvRow[];
};
