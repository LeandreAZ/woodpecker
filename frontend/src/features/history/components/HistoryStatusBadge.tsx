import type { HistoryTimelineItem } from '../types/history.types';
import { STATUS_META } from '../utils/historyFilters';

export function HistoryStatusBadge({ status, statusLabel }: Pick<HistoryTimelineItem, 'status' | 'statusLabel'>) {
  if (!status) {
    return null;
  }

  const meta = STATUS_META[status];
  return <span className={`wp-training-history-status ${meta.badgeClassName}`}>{statusLabel || meta.label}</span>;
}
