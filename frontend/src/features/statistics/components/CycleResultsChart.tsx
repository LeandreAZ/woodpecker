import type { TrainingCycleSummary } from '../../trainings/types/training.types';
import { formatPercentShare } from '../utils/statisticsFormatting';
import { RESULT_COLORS, buildCycleResultBreakdown, hasCycleActivity } from '../utils/statisticsModel';

export function CycleResultColumns({ cycleRows }: { cycleRows: TrainingCycleSummary[] }) {
  const visibleCount = Math.max(5, cycleRows.length);
  const slots = Array.from({ length: visibleCount }, (_, index) => cycleRows[index] ?? null);

  return (
    <div className="wp-training-stats-cycle-results">
      <div className="wp-training-stats-cycle-results__legend">
        <span><i style={{ backgroundColor: RESULT_COLORS.direct }} />Réussis directement</span>
        <span><i style={{ backgroundColor: RESULT_COLORS.rescued }} />Rattrapés après erreur</span>
        <span><i style={{ backgroundColor: RESULT_COLORS.unresolved }} />Non résolus</span>
      </div>
      <div className="wp-training-stats-cycle-results__columns">
        {slots.map((cycle, index) => {
          if (!cycle) {
            return (
              <div className="wp-training-stats-cycle-results__column" key={`placeholder-${index}`}>
                <div className="wp-training-stats-cycle-results__stack is-placeholder" />
                <strong>{`Cycle ${index + 1}`}</strong>
              </div>
            );
          }

          const breakdown = buildCycleResultBreakdown(cycle);
          const total = Math.max(breakdown.direct + breakdown.rescued + breakdown.unresolved, 1);
          const current = cycle.cycle.status === 'active';
          const hasActivity = hasCycleActivity(cycle);

          return (
            <div className="wp-training-stats-cycle-results__column" key={cycle.cycle['@id']}>
              <div className={`wp-training-stats-cycle-results__stack${hasActivity ? '' : ' is-placeholder'}${current ? ' is-current' : ''}`}>
                {breakdown.direct > 0 ? <span className="is-direct" style={{ height: formatPercentShare(breakdown.direct, total) }}>{breakdown.direct}</span> : null}
                {breakdown.rescued > 0 ? <span className="is-rescued" style={{ height: formatPercentShare(breakdown.rescued, total) }}>{breakdown.rescued}</span> : null}
                {breakdown.unresolved > 0 ? <span className="is-unresolved" style={{ height: formatPercentShare(breakdown.unresolved, total) }}>{breakdown.unresolved}</span> : null}
              </div>
              <strong>{`Cycle ${cycle.cycle.number}`}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
