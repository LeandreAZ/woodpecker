import { type CSSProperties } from 'react';
import { ChevronRight, Lock, X } from 'lucide-react';
import { Modal } from '../../../../shared/ui';
import { formatStatsDuration } from '../../utils/training.utils';
import type { Cycle, CycleStats, TrainingCycleSummary } from '../../types/training.types';
import { formatCompactDate } from '../../models/detailModel';

function hasCycleActivity(cycle: TrainingCycleSummary) {
  return (cycle.attemptCount ?? 0) > 0
    || (cycle.completedPuzzleCount ?? 0) > 0
    || cycle.solved > 0
    || cycle.failed > 0;
}

function ProgressRing({ percent }: { percent: number }) {
  const style = {
    '--detail-progress': `${Math.max(Math.min(percent, 100), 0)}%`,
  } as CSSProperties;

  return (
    <div className="wp-detail-cycle-ring" style={style}>
      <div>
        <strong>{percent}%</strong>
      </div>
    </div>
  );
}

function buildCyclePeriod(cycle: Cycle | null) {
  if (!cycle?.startedAt) {
    return 'Date indisponible';
  }

  const start = formatCompactDate(cycle.startedAt);
  const end = cycle.completedAt ? formatCompactDate(cycle.completedAt) : 'Dates indisponibles';
  return `${start} - ${end}`;
}

function getCycleSupportText(cycle: Cycle | null, cycleStatusLabel: string) {
  if (!cycle?.startedAt) {
    return cycleStatusLabel;
  }

  const start = new Date(cycle.startedAt).getTime();
  if (Number.isNaN(start)) {
    return cycleStatusLabel;
  }

  const days = Math.max(Math.ceil((Date.now() - start) / 86400000), 0);
  return `${days} jour${days > 1 ? 's' : ''} depuis le démarrage`;
}

export function DetailCycleStatus({
  currentCycle,
  cycleStats,
  cycleStatusLabel,
}: {
  currentCycle: Cycle | null;
  cycleStats: CycleStats;
  cycleStatusLabel: string;
}) {
  return (
    <section className="wp-panel wp-detail-section wp-detail-cycle-status">
      <div className="wp-detail-section__header">
        <div>
          <h2>Statut du cycle</h2>
        </div>
      </div>

      <div className="wp-detail-cycle-status__grid">
        <div className="wp-detail-cycle-status__summary">
          <ProgressRing percent={cycleStats.progressPercent} />
          <div>
            <strong>{currentCycle ? `Cycle ${currentCycle.number}` : 'Cycle en cours'}</strong>
            <p>{buildCyclePeriod(currentCycle)}</p>
            <small>{getCycleSupportText(currentCycle, cycleStatusLabel)}</small>
          </div>
        </div>

        <div className="wp-detail-cycle-status__lock">
          <span className="wp-detail-cycle-status__lock-icon">
            <Lock aria-hidden="true" size={18} strokeWidth={2} />
          </span>
          <div>
            <strong>Collection verrouillée</strong>
            <p>Un cycle a déjà démarré, la collection des problèmes est définitivement verrouillée.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DetailCycleHistory({ cycleSummaries, onViewAll }: { cycleSummaries: TrainingCycleSummary[]; onViewAll: () => void; }) {
  return (
    <section className="wp-panel wp-detail-section wp-detail-side-section">
      <div className="wp-detail-section__header">
        <div>
          <h2>Historique des cycles</h2>
        </div>
        {cycleSummaries.length > 0 ? <button className="wp-detail-section__link" type="button" onClick={onViewAll}>Voir tout</button> : null}
      </div>

      {cycleSummaries.length === 0 ? (
        <p className="wp-empty">Aucun cycle enregistré pour le moment.</p>
      ) : (
        <div className="wp-detail-side-list">
          {cycleSummaries.slice(0, 3).map((item, index) => (
            <article key={item.cycle['@id']} className="wp-detail-side-row wp-detail-side-row--history">
              <div className="wp-detail-side-row__copy">
                <strong>
                  {`Cycle ${item.cycle.number}`}
                  {index === 0 && item.cycle.status === 'active' ? ' (en cours)' : ''}
                </strong>
                <small>{buildCyclePeriod(item.cycle)}</small>
              </div>
              <div className="wp-detail-side-row__metrics">
                <span className="wp-detail-side-row__metric">
                  <strong className="tone-success">{hasCycleActivity(item) ? (item.successRate !== undefined ? `${Math.round(item.successRate)} %` : `${item.solved}`) : '—'}</strong>
                  <small>Réussite</small>
                </span>
                <span className="wp-detail-side-row__metric">
                  <strong className="tone-primary">{!hasCycleActivity(item) || item.progressDelta === null || item.progressDelta === undefined ? '—' : `${item.progressDelta > 0 ? '+' : ''}${item.progressDelta}%`}</strong>
                  <small>Progression</small>
                </span>
              </div>
              <ChevronRight aria-hidden="true" className="wp-detail-side-row__arrow" size={16} strokeWidth={2} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function DetailCycleHistoryModal({ cycleSummaries, onClose, open }: { cycleSummaries: TrainingCycleSummary[]; onClose: () => void; open: boolean; }) {
  return (
    <Modal contentClassName="ui-modal__content--plain" open={open} onClose={onClose}>
      <div className="wp-detail-modal-card">
        <div className="wp-detail-modal-card__header">
          <div>
            <h2>Historique des cycles</h2>
            <p>Consultez le détail de tous vos cycles d'entraînement.</p>
          </div>
          <button aria-label="Fermer" className="ui-modal-close wp-detail-modal-card__close" type="button" onClick={onClose}>
            <X aria-hidden="true" size={18} strokeWidth={1.9} />
          </button>
        </div>
        <div className="wp-detail-modal-card__divider" />
        {cycleSummaries.length === 0 ? (
          <p className="wp-empty">Aucun cycle enregistré pour le moment.</p>
        ) : (
          <div className="wp-detail-modal-table-wrap">
            <table className="wp-detail-modal-table">
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Période</th>
                  <th>Réussite</th>
                  <th>Progression</th>
                  <th>Tentatives</th>
                  <th>Temps</th>
                </tr>
              </thead>
              <tbody>
                {cycleSummaries.map((item, index) => {
                  const rowKey = item.cycle['@id'] ?? String(item.cycle.number) + '-' + String(index);
                  const cycleLabel = 'Cycle ' + String(item.cycle.number);
                  const active = hasCycleActivity(item);
                  const successLabel = !active ? '—' : item.successRate !== undefined ? String(Math.round(item.successRate)) + ' %' : '—';
                  const progressLabel = !active || item.progressDelta === null || item.progressDelta === undefined
                    ? '—'
                    : (item.progressDelta > 0 ? '+' : '') + String(item.progressDelta) + '%';

                  return (
                    <tr key={rowKey}>
                      <td>
                        {cycleLabel}
                        {index === 0 && item.cycle.status === 'active' ? ' (en cours)' : ''}
                      </td>
                      <td>{buildCyclePeriod(item.cycle)}</td>
                      <td><span className="wp-detail-cycle-value tone-success">{successLabel}</span></td>
                      <td><span className="wp-detail-cycle-value tone-primary">{progressLabel}</span></td>
                      <td><span className="wp-detail-cycle-value tone-info">{active ? item.attemptCount : '—'}</span></td>
                      <td>{formatStatsDuration(item.durationMilliseconds ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

