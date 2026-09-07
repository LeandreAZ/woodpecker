import type { HistoryActivityType, HistoryFilterPreset, HistoryItemStatus, HistoryOverview } from '../types/history.types';

export type HistoryFilterState = {
  activity: 'all' | HistoryActivityType;
  pageSize: number;
  periodDays: number | 'all';
  search: string;
  status: 'all' | HistoryItemStatus;
  training: string;
};

export type TrainingsHistoryViewProps = {
  errorMessage?: string;
  historyOverview: HistoryOverview | null;
  initialFilterPreset?: HistoryFilterPreset | null;
  isError: boolean;
  isLoading: boolean;
  onInitialFilterPresetApplied?: () => void;
};
