import type { TrainingCycleSummary, TrainingSummary } from '../../trainings/types/training.types';
import type { DistributionSegment } from '../types/statisticsView.types';
import { ATTEMPT_COLORS, buildAttemptDistribution } from '../utils/statisticsModel';
import { ChartEmpty } from './ChartEmpty';
import { DistributionDonut } from './DistributionDonut';
import { DistributionLegend } from './DistributionLegend';

export function AttemptDistribution({ summary, cycleRows, preferSummary }: { summary: TrainingSummary | null; cycleRows: TrainingCycleSummary[]; preferSummary: boolean }) {
  const distribution = buildAttemptDistribution(summary, cycleRows, preferSummary);

  if (!distribution || distribution.resolvedPuzzleCount <= 0) {
    return <ChartEmpty message="Aucun puzzle résolu sur cette période." />;
  }

  const total = distribution.resolvedPuzzleCount;
  const segments: DistributionSegment[] = [
    { color: ATTEMPT_COLORS[0], label: '1 essai', value: distribution.oneAttemptCount },
    { color: ATTEMPT_COLORS[1], label: '2 essais', value: distribution.twoAttemptCount },
    { color: ATTEMPT_COLORS[2], label: '3 essais', value: distribution.threeAttemptCount },
    { color: ATTEMPT_COLORS[3], label: '4 essais ou plus', value: distribution.fourPlusAttemptCount },
  ];

  return (
    <div className="wp-training-stats-result-distribution">
      <DistributionDonut centerLabel="Puzzles résolus" centerValue={String(total)} segments={segments} />
      <DistributionLegend segments={segments} total={total} />
    </div>
  );
}
