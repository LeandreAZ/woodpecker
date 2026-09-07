import type { TrainingReference, Cycle } from '../../trainings/types/training.types';

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

export type HistoryFilterPreset = Partial<{
  activity: 'all' | HistoryActivityType;
  pageSize: number;
  periodDays: number | 'all';
  search: string;
  status: 'all' | HistoryItemStatus;
  training: string;
}>;

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
  progressDelta?: number | null;
  successRate?: number;
  attemptCount: number;
  averageAttempts?: number;
  durationMilliseconds?: number;
};

export type TrainingCycleHistory = {
  training: TrainingReference;
  cycles: DetailedCycleHistoryItem[];
};

