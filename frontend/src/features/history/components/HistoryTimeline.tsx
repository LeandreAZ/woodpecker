import {
  CalendarDays,
  Clock3,
  Puzzle,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { TrainingLogoBadge } from '../../trainings/components/identity/TrainingBranding';
import type { HistoryTimelineItem } from '../types/history.types';
import { isAttemptItem } from '../utils/historyFilters';
import { formatCompactDateTime, formatDesktopDate, formatDesktopTime, formatDuration } from '../utils/historyFormatting';
import { HistoryStatusBadge } from './HistoryStatusBadge';

export function HistoryTimeline({ pageItems }: { pageItems: HistoryTimelineItem[] }) {
  return (
    <div className="wp-training-history-cards">
      {pageItems.map((item) => isAttemptItem(item) ? (
        <article className="wp-training-history-card wp-training-history-card--attempt" key={`${item['@id']}-card`}>
          <div className="wp-training-history-card__attempt-grid wp-training-history-card__attempt-grid--v2">
            <div className="wp-training-history-card__heading wp-training-history-card__heading--v2">
              <div className="wp-training-history-card__identity">
                <div className="wp-training-history-card__icon-wrap">
                  {item.training ? <TrainingLogoBadge size="sm" training={item.training} /> : null}
                </div>
                <div className="wp-training-history-card__title-wrap">
                  <strong>{item.training?.name ?? 'Entraînement'}</strong>
                </div>
              </div>
              <HistoryStatusBadge status={item.status} statusLabel={item.statusLabel} />
            </div>
            <div className="wp-training-history-card__meta-line wp-training-history-card__meta-line--v2">
              <span><RefreshCw size={14} />{item.cycle ? `Cycle ${item.cycle.number}` : 'Sans cycle'}</span>
              <span><Puzzle size={14} />{item.label}</span>
              <span><RotateCcw size={14} />{item.attemptNumber ? `Essai ${item.attemptNumber}` : 'Essai —'}</span>
            </div>
            <div className="wp-training-history-card__footer-line wp-training-history-card__footer-line--v2">
              <span><CalendarDays size={14} />{formatCompactDateTime(item.occurredAt)}</span>
              <span className="wp-training-history-card__footer-separator">|</span>
              <span><Clock3 size={14} />{formatDuration(item.durationMilliseconds)}</span>
            </div>
          </div>
        </article>
      ) : (
        <article className="wp-training-history-card wp-training-history-card--auth" key={`${item['@id']}-card`}>
          <strong className="wp-training-history-card__auth-title">{item.label}</strong>
          <div className="wp-training-history-card__auth-datetime">
            <span>{formatDesktopDate(item.occurredAt)}</span>
            <span>{formatDesktopTime(item.occurredAt)}</span>
          </div>
          {item.detail ? <p className="wp-training-history-card__auth-detail">{item.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}
