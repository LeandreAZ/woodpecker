import * as AppIcons from '../../../shared/icons/AppIcons';
import type { StatsMetricKey } from '../types/statisticsView.types';

export function FilterIcon() {
  return <AppIcons.TargetIcon width={18} height={18} />;
}

export function MetricIcon({ metric }: { metric: StatsMetricKey }) {
  if (metric === 'averageAttempts') {
    return <AppIcons.RepeatIcon width={18} height={18} />;
  }

  if (metric === 'trainingTime') {
    return <AppIcons.HistoryIcon width={18} height={18} />;
  }

  return <AppIcons.TargetIcon width={18} height={18} />;
}
