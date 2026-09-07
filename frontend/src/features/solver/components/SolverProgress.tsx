import { type CSSProperties } from 'react';
import * as AppIcons from '../../../shared/icons/AppIcons';
import { getRingValueClassName } from '../utils/solverFormatting';

export function SolverProgress({ progressRingStyle, progressLabel, cycleNumber, cycleDateLabel, progressMetricLabel, elapsedLabel }: { progressRingStyle: CSSProperties; progressLabel: string; cycleNumber: number; cycleDateLabel: string; progressMetricLabel: string; elapsedLabel: string }) {
  return (
    <section className="wp-panel wp-solver-topbar-v2">
      <div className="wp-solver-topbar-v2__cycle">
        <div className="wp-solver-topbar-v2__ring" style={progressRingStyle}><div><strong className={getRingValueClassName(progressLabel)}>{progressLabel}</strong></div></div>
        <div className="wp-solver-topbar-v2__cycle-copy"><div><strong>{`Cycle ${cycleNumber}`}</strong><p>{cycleDateLabel}</p></div></div>
      </div>
      <div className="wp-solver-topbar-v2__metrics">
        <div className="wp-solver-topbar-v2__metric"><span className="wp-solver-topbar-v2__metric-icon tone-blue"><AppIcons.TrendUpIcon /></span><div><strong>Progression du cycle</strong><p className="wp-solver-topbar-v2__metric-value is-progress">{progressMetricLabel}</p></div></div>
        <div className="wp-solver-topbar-v2__metric"><span className="wp-solver-topbar-v2__metric-icon tone-blue"><AppIcons.HistoryIcon /></span><div><strong>Durée du puzzle</strong><p className="wp-solver-topbar-v2__metric-value is-progress">{elapsedLabel}</p></div></div>
      </div>
    </section>
  );
}
