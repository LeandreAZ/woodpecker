import { TrainingLogoBadge } from '../../trainings/components/identity/TrainingBranding';
import type { HistoryTimelineItem } from '../types/history.types';
import { isAttemptItem } from '../utils/historyFilters';
import { formatDesktopDate, formatDesktopTime, formatDuration } from '../utils/historyFormatting';
import { HistoryStatusBadge } from './HistoryStatusBadge';

export function HistoryTable({ pageItems, authOnlyView }: { pageItems: HistoryTimelineItem[]; authOnlyView: boolean }) {
  return (
    <div className="wp-training-history-table-wrap">
      <table className="wp-training-history-table">
        <thead>
          <tr>
            {authOnlyView ? (
              <>
                <th>Activité</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Détail</th>
              </>
            ) : (
              <>
                <th>Entraînement</th>
                <th>Cycle</th>
                <th>Activité</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Statut</th>
                <th>Durée</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {pageItems.map((item) => authOnlyView ? (
            <tr key={item['@id']}>
              <td>{item.label}</td>
              <td>{formatDesktopDate(item.occurredAt)}</td>
              <td>{formatDesktopTime(item.occurredAt)}</td>
              <td>{item.detail || '—'}</td>
            </tr>
          ) : (
            <tr key={item['@id']}>
              <td>
                {item.training ? (
                  <span className="wp-training-history-training-cell">
                    <TrainingLogoBadge size="sm" training={item.training} />
                    <span>{item.training.name}</span>
                  </span>
                ) : '—'}
              </td>
              <td>{item.cycle ? `Cycle ${item.cycle.number}` : '—'}</td>
              <td>
                <div className="wp-training-history-activity-cell">
                  <strong>{item.label}</strong>
                  {item.attemptNumber ? <span>Essai {item.attemptNumber}</span> : item.detail ? <span>{item.detail}</span> : null}
                </div>
              </td>
              <td>{formatDesktopDate(item.occurredAt)}</td>
              <td>{formatDesktopTime(item.occurredAt)}</td>
              <td>{item.status ? <HistoryStatusBadge status={item.status} statusLabel={item.statusLabel} /> : '—'}</td>
              <td>{isAttemptItem(item) ? formatDuration(item.durationMilliseconds) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
