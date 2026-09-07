import type { CyclePoint } from '../types/statisticsView.types';
import { ChartEmpty } from './ChartEmpty';

export function GenericLineChart({
  accentClassName,
  emptyMessage,
  formatTooltipValue,
  gridValues,
  metricLabel,
  points,
}: {
  accentClassName?: string;
  emptyMessage: string;
  formatTooltipValue: (value: number) => string;
  gridValues: number[];
  metricLabel: string;
  points: CyclePoint[];
}) {
  if (points.length === 0) {
    return <ChartEmpty message={emptyMessage} />;
  }

  const viewBoxWidth = 520;
  const viewBoxHeight = 280;
  const paddingLeft = 52;
  const paddingRight = 20;
  const paddingTop = 18;
  const paddingBottom = 56;
  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom;
  const stepX = points.length > 1 ? chartWidth / points.length : chartWidth / 2;
  const maxValue = Math.max(...gridValues, 1);
  const plottedPoints = points.map((point, index) => ({
    ...point,
    x: paddingLeft + stepX * index + stepX / 2,
    y: paddingTop + chartHeight - (point.value / maxValue) * chartHeight,
  }));
  const path = plottedPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className={`wp-training-stats-chart ${accentClassName ?? ''}`.trim()}>
      <div className="wp-training-stats-chart__header-inline">{metricLabel}</div>
      <div className="wp-training-stats-chart__canvas">
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="none" aria-label={metricLabel}>
          {gridValues.map((tick) => {
            const y = paddingTop + chartHeight - (tick / maxValue) * chartHeight;
            return (
              <g key={tick}>
                <line className="wp-training-stats-chart__grid" x1={paddingLeft} x2={viewBoxWidth - paddingRight} y1={y} y2={y} />
                <text className="wp-training-stats-chart__axis-label" x={8} y={y + 4}>{formatTooltipValue(tick)}</text>
              </g>
            );
          })}

          {plottedPoints.map((point) => (
            <line key={`guide-${point.label}`} className="wp-training-stats-chart__axis" x1={point.x} x2={point.x} y1={paddingTop} y2={paddingTop + chartHeight} />
          ))}

          {plottedPoints.map((point) => (
            <line key={`stem-${point.label}`} className="wp-training-stats-chart__stem" x1={point.x} x2={point.x} y1={point.y} y2={paddingTop + chartHeight} />
          ))}

          {plottedPoints.length > 1 ? <path className="wp-training-stats-chart__line" d={path} /> : null}

          {plottedPoints.map((point) => (
            <g key={point.label}>
              <circle className="wp-training-stats-chart__dot" cx={point.x} cy={point.y} r="5" />
              <text className="wp-training-stats-chart__point-value" x={point.x} y={Math.max(18, point.y - 14)} textAnchor="middle">
                {formatTooltipValue(point.value)}
              </text>
              <text className="wp-training-stats-chart__x-label" x={point.x} y={viewBoxHeight - 10} textAnchor="middle">
                {point.label}
              </text>
              <title>{`${point.label} · ${formatTooltipValue(point.value)}`}</title>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
