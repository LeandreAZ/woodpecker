import { TrainingLogoBadge } from '../../trainings/components/identity/TrainingBranding';
import type { TrainingDashboardSummary } from '../../trainings/types/training.types';
import { truncateLabel } from '../utils/statisticsFormatting';

export function TrainingCell({ training }: { training: TrainingDashboardSummary['training'] }) {
  return (
    <span className="wp-training-stats-training-cell">
      <TrainingLogoBadge size="sm" training={training} />
      <strong title={training.name}>{truncateLabel(training.name, 28)}</strong>
    </span>
  );
}
