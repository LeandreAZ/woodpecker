import type { DistributionSegment, ResultBreakdown } from '../types/statisticsView.types';
import { RESULT_COLORS } from '../utils/statisticsModel';
import { DistributionDonut } from './DistributionDonut';
import { DistributionLegend } from './DistributionLegend';

export function ResultDistribution({ breakdown, totalLabel, totalValue }: { breakdown: ResultBreakdown; totalLabel: string; totalValue: string }) {
  const segments: DistributionSegment[] = [
    { color: RESULT_COLORS.direct, description: 'Résolus dès le premier essai', label: 'Réussis directement', value: breakdown.direct },
    { color: RESULT_COLORS.rescued, description: 'Ratés puis finalement résolus', label: 'Rattrapés après erreur', value: breakdown.rescued },
    { color: RESULT_COLORS.unresolved, description: 'Aucune résolution finale', label: 'Non résolus', value: breakdown.unresolved },
  ];
  const total = Math.max(segments.reduce((sum, segment) => sum + segment.value, 0), 1);

  return (
    <div className="wp-training-stats-result-distribution">
      <DistributionDonut centerLabel={totalLabel} centerValue={totalValue} segments={segments} />
      <DistributionLegend segments={segments} total={total} />
    </div>
  );
}
