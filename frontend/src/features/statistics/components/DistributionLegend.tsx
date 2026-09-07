import type { DistributionSegment } from '../types/statisticsView.types';
import { formatPercentShare } from '../utils/statisticsFormatting';

export function DistributionLegend({ segments, total }: { segments: DistributionSegment[]; total: number }) {
  return (
    <div className="wp-training-stats-result-distribution__legend">
      {segments.map((segment) => (
        <div className="wp-training-stats-result-row" key={segment.label}>
          <div className="wp-training-stats-result-row__main">
            <span className="wp-training-stats-result-row__dot" style={{ backgroundColor: segment.color }} />
            <div>
              <strong>{segment.label}</strong>
              {segment.description ? <small>{segment.description}</small> : null}
            </div>
          </div>
          <div className="wp-training-stats-result-row__meta">
            <strong>{formatPercentShare(segment.value, total)}</strong>
            <span>{segment.valueLabel ?? segment.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
