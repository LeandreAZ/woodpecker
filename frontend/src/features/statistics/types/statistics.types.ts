import type { TrainingDashboardSummary } from '../../trainings/types/training.types';

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

