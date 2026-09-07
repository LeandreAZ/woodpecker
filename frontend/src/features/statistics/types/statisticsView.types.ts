import { type ReactElement } from 'react';
import type { TrainingSummary, View } from '../../trainings/types/training.types';
import type { StatsOverview } from '../types/statistics.types';

export type TrainingsStatsViewProps = {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  onOpenTraining: (trainingIri: string, view?: View) => void;
  onSelectTrainingIri: (trainingIri: string | null) => void;
  selectedTrainingIri: string | null;
  statsOverview: StatsOverview | null;
  summary: TrainingSummary | null;
  summaryError?: string;
  summaryIsError: boolean;
  summaryIsLoading: boolean;
};

export type StatsMetricKey = 'averageAttempts' | 'successRate' | 'trainingTime';

export type CardDefinition = {
  accent: 'info' | 'positive' | 'violet';
  icon: ReactElement;
  label: string;
  value: string;
};

export type CyclePoint = {
  label: string;
  value: number;
};

export type DistributionSegment = {
  color: string;
  description?: string;
  label: string;
  value: number;
  valueLabel?: string;
};

export type ResultBreakdown = {
  direct: number;
  rescued: number;
  unresolved: number;
};
