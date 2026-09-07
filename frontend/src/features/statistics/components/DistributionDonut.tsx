import { type CSSProperties } from 'react';
import type { DistributionSegment } from '../types/statisticsView.types';
import { buildDonutBackground } from '../utils/statisticsModel';

export function DistributionDonut({ centerLabel, centerValue, segments }: { centerLabel: string; centerValue: string; segments: DistributionSegment[] }) {
  const donutStyle = { background: buildDonutBackground(segments) } as CSSProperties;

  return (
    <div className="wp-training-stats-donut" style={donutStyle}>
      <div>
        <strong>{centerValue}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}
