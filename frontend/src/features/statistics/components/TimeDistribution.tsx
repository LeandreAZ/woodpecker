import { X } from 'lucide-react';
import { Modal } from '../../../shared/ui';
import type { TrainingDashboardSummary } from '../../trainings/types/training.types';
import { formatStatsDuration } from '../../trainings/utils/training.utils';
import { buildTrainingTimeDistribution } from '../utils/statisticsModel';
import { ChartEmpty } from './ChartEmpty';
import { DistributionDonut } from './DistributionDonut';
import { DistributionLegend } from './DistributionLegend';

export function TrainingTimeDistribution({ maxVisibleRows = 5, rows }: { maxVisibleRows?: number | null; rows: TrainingDashboardSummary[] }) {
  const distribution = buildTrainingTimeDistribution(rows, maxVisibleRows);

  if (!distribution) {
    return <ChartEmpty message="Aucune répartition à afficher." />;
  }

  return (
    <div className="wp-training-stats-result-distribution">
      <DistributionDonut centerLabel="Total" centerValue={formatStatsDuration(distribution.totalDuration)} segments={distribution.segments} />
      <DistributionLegend segments={distribution.segments} total={distribution.totalDuration} />
    </div>
  );
}

export function TrainingTimeDistributionModal({ onClose, open, rows }: { onClose: () => void; open: boolean; rows: TrainingDashboardSummary[] }) {
  return (
    <Modal contentClassName="ui-modal__content--plain" open={open} onClose={onClose}>
      <div className="wp-training-stats-modal">
        <div className="wp-training-stats-modal__header">
          <div>
            <h2>Répartition du temps par training</h2>
            <p>Consultez la répartition complète avec les durées réelles enregistrées.</p>
          </div>
          <button aria-label="Fermer" className="ui-modal-close wp-training-stats-modal__close" type="button" onClick={onClose}>
            <X aria-hidden="true" size={18} strokeWidth={1.9} />
          </button>
        </div>
        <div className="wp-training-stats-modal__divider" />
        <TrainingTimeDistribution maxVisibleRows={null} rows={rows} />
      </div>
    </Modal>
  );
}
