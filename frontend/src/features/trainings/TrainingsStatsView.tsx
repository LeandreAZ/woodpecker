import { useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import * as AppIcons from '../../shared/AppIcons';
import { TrainingLogoBadge, resolveTrainingBranding } from './TrainingBranding';
import { formatDuration } from './trainingsUtils';
import type {
  StatsOverview,
  TrainingCycleSummary,
  TrainingDashboardSummary,
  TrainingSummary,
  View,
} from './trainingsTypes';
import './stats.css';

type TrainingsStatsViewProps = {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  onOpenTraining: (trainingIri: string, view?: View) => void;
  onSelectTrainingIri: (trainingIri: string | null) => void;
  selectedTrainingIri: string | null;
  statsOverview: StatsOverview | null;
  summary: TrainingSummary | null;
  summaryError?: string;
  summaryIsError: boolean;
  summaryIsLoading: boolean;
};

type StatsMetricKey = 'averageAttempts' | 'successRate';

type CardDefinition = {
  accent: 'info' | 'positive' | 'violet';
  icon: ReactElement;
  label: string;
  value: string;
};

type CyclePoint = {
  label: string;
  value: number;
};

type DistributionSegment = {
  color: string;
  description?: string;
  label: string;
  value: number;
  valueLabel?: string;
};

type ResultBreakdown = {
  direct: number;
  rescued: number;
  unresolved: number;
};

const PERIOD_OPTIONS = [
  { label: '7 derniers jours', value: 7 },
  { label: '14 derniers jours', value: 14 },
  { label: '30 derniers jours', value: 30 },
  { label: '60 derniers jours', value: 60 },
  { label: '90 derniers jours', value: 90 },
] as const;
const PERCENT_GRID = [0, 25, 50, 75, 100] as const;
const METRIC_OPTIONS: Array<{ key: StatsMetricKey; label: string }> = [
  { key: 'successRate', label: 'Taux de réussite' },
  { key: 'averageAttempts', label: 'Tentatives moyennes' },
];
const NEUTRAL_TRAINING_COLOR = '#41597f';
const RESULT_COLORS = {
  direct: '#22c55e',
  rescued: '#f59e0b',
  unresolved: '#ef4444',
} as const;
const ATTEMPT_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'] as const;

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function truncateLabel(value: string, maxLength = 18) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function formatCompactDate(value?: string | null) {
  if (!value) {
    return 'Aucune date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Aucune date';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCyclePeriod(cycle: TrainingCycleSummary) {
  const started = formatCompactDate(cycle.cycle.startedAt);
  const completed = cycle.cycle.completedAt ? formatCompactDate(cycle.cycle.completedAt) : null;
  return completed ? `${started} - ${completed}` : started;
}

function formatAverageAttempts(value?: number | null) {
  const normalized = Math.round((value ?? 0) * 10) / 10;
  return normalized.toLocaleString('fr-FR', {
    minimumFractionDigits: normalized % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatAveragePuzzleTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0 ? `${minutes}m${remainingSeconds}s` : `${minutes}m`;
}

function getAdaptiveNumericMax(values: number[], minimum = 1) {
  const maxValue = Math.max(...values.filter((value) => Number.isFinite(value) && value > 0), 0);
  if (maxValue <= minimum) {
    return minimum;
  }

  return maxValue * 1.15;
}

function getAdaptiveTimeMax(values: number[]) {
  const maxValue = Math.max(...values.filter((value) => value > 0), 0);
  if (maxValue <= 0) return 60;
  const padded = maxValue * 1.2;
  if (padded <= 30) return 30;
  if (padded <= 60) return 60;
  if (padded <= 120) return 120;
  if (padded <= 180) return 180;
  if (padded <= 300) return 300;
  return Math.ceil(padded / 60) * 60;
}

function buildCard(label: string, value: string, icon: ReactElement, accent: CardDefinition['accent']): CardDefinition {
  return { accent, icon, label, value };
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, offset: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + offset);
  return next;
}

function resolveCycleDate(cycle: TrainingCycleSummary) {
  const source = cycle.cycle.completedAt ?? cycle.cycle.startedAt;
  if (!source) {
    return null;
  }

  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
}

function filterCycleRows(summary: TrainingSummary | null, days: number) {
  const source = [...(summary?.cycleSummaries ?? [])].sort((left, right) => left.cycle.number - right.cycle.number);
  if (source.length === 0) {
    return [];
  }

  const endDate = startOfDay(new Date());
  const startDate = addDays(endDate, -(days - 1));
  const filtered = source.filter((cycle) => {
    const date = resolveCycleDate(cycle);
    return date ? date >= startDate : false;
  });

  return filtered.length > 0 ? filtered : source;
}

function buildSelectedCards(cycleRows: TrainingCycleSummary[], selectedSummary: TrainingDashboardSummary | null) {
  const solved = cycleRows.reduce((total, cycle) => total + cycle.solved, 0);
  const failed = cycleRows.reduce((total, cycle) => total + cycle.failed, 0);
  const completedAttemptCount = cycleRows.reduce((sum, cycle) => sum + cycle.attemptCount, 0);
  const puzzlesWithCompletedAttemptsCount = cycleRows.reduce((sum, cycle) => sum + (cycle.puzzlesWithCompletedAttemptsCount ?? 0), 0);
  const durationMilliseconds = cycleRows.reduce((sum, cycle) => sum + (cycle.durationMilliseconds ?? 0), 0);

  return [
    buildCard('Taux de réussite', `${(solved + failed) > 0 ? clampPercent((solved / (solved + failed)) * 100) : 0}%`, <AppIcons.TargetIcon width={20} height={20} />, 'info'),
    buildCard('Progression', `${selectedSummary?.progressPercent ?? 0}%`, <AppIcons.TrendUpIcon width={20} height={20} />, 'positive'),
    buildCard("Temps d'entraînement", formatDuration(durationMilliseconds), <AppIcons.HistoryIcon width={20} height={20} />, 'info'),
    buildCard('Tentatives moyennes', formatAverageAttempts(puzzlesWithCompletedAttemptsCount > 0 ? completedAttemptCount / puzzlesWithCompletedAttemptsCount : 0), <AppIcons.RepeatIcon width={20} height={20} />, 'violet'),
  ];
}

function buildCycleMetricPoints(cycleRows: TrainingCycleSummary[], metric: StatsMetricKey): CyclePoint[] {
  return cycleRows.map((cycle) => ({
    label: `Cycle ${cycle.cycle.number}`,
    value: metric === 'averageAttempts' ? cycle.averageAttempts ?? 0 : cycle.successRate ?? 0,
  }));
}

function buildCycleTimePoints(cycleRows: TrainingCycleSummary[]): CyclePoint[] {
  return cycleRows
    .filter((cycle) => (cycle.completedPuzzleCount ?? 0) > 0)
    .map((cycle) => ({
      label: `Cycle ${cycle.cycle.number}`,
      value: ((cycle.durationMilliseconds ?? 0) / Math.max(cycle.completedPuzzleCount ?? 1, 1)) / 1000,
    }));
}

function buildResultBreakdown(source: {
  failedCount?: number;
  rescuedCount?: number;
  solvedCount?: number;
  unresolvedCount?: number;
}): ResultBreakdown {
  const direct = Math.max(0, source.solvedCount ?? 0);
  const rescued = Math.max(0, source.rescuedCount ?? 0);
  const unresolved = Math.max(0, source.unresolvedCount ?? ((source.failedCount ?? 0) - rescued));
  return { direct, rescued, unresolved };
}

function buildCycleResultBreakdown(cycle: TrainingCycleSummary): ResultBreakdown {
  return buildResultBreakdown({
    failedCount: cycle.failed,
    rescuedCount: cycle.rescuedCount,
    solvedCount: cycle.solved,
    unresolvedCount: cycle.unresolvedCount,
  });
}

function buildAttemptDistribution(summary: TrainingSummary | null, cycleRows: TrainingCycleSummary[], preferSummary = true) {
  const distribution = summary?.attemptCountDistribution;
  if (preferSummary && distribution && distribution.resolvedPuzzleCount > 0) {
    return distribution;
  }

  const oneAttemptCount = cycleRows.reduce((sum, cycle) => sum + Math.max(cycle.solved ?? 0, 0), 0);
  const twoAttemptCount = cycleRows.reduce((sum, cycle) => sum + Math.max(cycle.rescuedCount ?? 0, 0), 0);
  const resolvedPuzzleCount = oneAttemptCount + twoAttemptCount;

  if (resolvedPuzzleCount <= 0) {
    return null;
  }

  return {
    oneAttemptCount,
    twoAttemptCount,
    threeAttemptCount: 0,
    fourPlusAttemptCount: 0,
    resolvedPuzzleCount,
  };
}

function formatPercentShare(value: number, total: number) {
  if (total <= 0) {
    return '0%';
  }

  return `${Math.round((value / total) * 100)}%`;
}

function buildDonutBackground(segments: DistributionSegment[], trackColor = 'rgba(54, 74, 102, 0.58)') {
  const total = Math.max(segments.reduce((sum, segment) => sum + segment.value, 0), 0);
  if (total <= 0) {
    return `radial-gradient(circle at center, #091427 0 41%, transparent 42%), conic-gradient(${trackColor} 0 100%)`;
  }

  let cursor = 0;
  const stops: string[] = [];

  segments.forEach((segment) => {
    const start = cursor;
    cursor += (segment.value / total) * 100;
    stops.push(`${segment.color} ${start}% ${cursor}%`);
  });

  if (cursor < 100) {
    stops.push(`${trackColor} ${cursor}% 100%`);
  }

  return `radial-gradient(circle at center, #091427 0 41%, transparent 42%), conic-gradient(${stops.join(', ')})`;
}

function ChartEmpty({ message }: { message: string }) {
  return <div className="wp-training-stats-chart__empty">{message}</div>;
}

function GenericLineChart({
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

function TrainingCell({ training }: { training: TrainingDashboardSummary['training'] }) {
  return (
    <span className="wp-training-stats-training-cell">
      <TrainingLogoBadge size="sm" training={training} />
      <strong title={training.name}>{truncateLabel(training.name, 28)}</strong>
    </span>
  );
}

function FilterIcon() {
  return <AppIcons.TargetIcon width={18} height={18} />;
}

function MetricIcon({ metric }: { metric: StatsMetricKey }) {
  if (metric === 'averageAttempts') {
    return <AppIcons.RepeatIcon width={18} height={18} />;
  }

  return <AppIcons.TargetIcon width={18} height={18} />;
}

function DistributionDonut({ centerLabel, centerValue, segments }: { centerLabel: string; centerValue: string; segments: DistributionSegment[] }) {
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

function DistributionLegend({ segments, total }: { segments: DistributionSegment[]; total: number }) {
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

function ResultDistribution({ breakdown, totalLabel, totalValue }: { breakdown: ResultBreakdown; totalLabel: string; totalValue: string }) {
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

function TrainingTimeDistribution({ rows }: { rows: TrainingDashboardSummary[] }) {
  const activeRows = [...rows]
    .filter((row) => (row.durationMilliseconds ?? 0) > 0)
    .sort((left, right) => (right.durationMilliseconds ?? 0) - (left.durationMilliseconds ?? 0));

  if (activeRows.length === 0) {
    return <ChartEmpty message="Aucune répartition à afficher." />;
  }

  const fallbackRows = rows.filter((row) => !activeRows.some((activeRow) => activeRow.training['@id'] === row.training['@id']));
  const visibleRows = [...activeRows, ...fallbackRows].slice(0, 5);
  const totalDuration = activeRows.reduce((sum, row) => sum + (row.durationMilliseconds ?? 0), 0);
  const hiddenDuration = activeRows
    .filter((row) => !visibleRows.some((visibleRow) => visibleRow.training['@id'] === row.training['@id']))
    .reduce((sum, row) => sum + (row.durationMilliseconds ?? 0), 0);
  const segments = visibleRows.map((row) => ({
    color: resolveTrainingBranding(row.training).iconBackgroundColor ?? NEUTRAL_TRAINING_COLOR,
    label: row.training.name,
    value: row.durationMilliseconds ?? 0,
    valueLabel: formatDuration(row.durationMilliseconds ?? 0),
  }));
  const finalSegments = hiddenDuration > 0
    ? [...segments, { color: NEUTRAL_TRAINING_COLOR, label: 'Autres', value: hiddenDuration, valueLabel: formatDuration(hiddenDuration) }]
    : segments;

  return (
    <div className="wp-training-stats-result-distribution">
      <DistributionDonut centerLabel="Total" centerValue={formatDuration(totalDuration)} segments={finalSegments} />
      <DistributionLegend segments={finalSegments} total={totalDuration} />
    </div>
  );
}

function CycleResultColumns({ cycleRows }: { cycleRows: TrainingCycleSummary[] }) {
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

          return (
            <div className="wp-training-stats-cycle-results__column" key={cycle.cycle['@id']}>
              <div className="wp-training-stats-cycle-results__stack">
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

function AttemptDistribution({ summary, cycleRows, preferSummary }: { summary: TrainingSummary | null; cycleRows: TrainingCycleSummary[]; preferSummary: boolean }) {
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

export function TrainingsStatsView({
  errorMessage,
  isError,
  isLoading,
  onOpenTraining,
  onSelectTrainingIri,
  selectedTrainingIri,
  statsOverview,
  summary,
  summaryError,
  summaryIsError,
  summaryIsLoading,
}: TrainingsStatsViewProps) {
  const [selectedDays, setSelectedDays] = useState<(typeof PERIOD_OPTIONS)[number]['value']>(30);
  const [selectedMetric, setSelectedMetric] = useState<StatsMetricKey>('successRate');
  const [selectedAttemptScope, setSelectedAttemptScope] = useState<'all' | string>('all');
  const trainingBreakdown = statsOverview?.trainingBreakdown ?? [];
  const selectedSummary = selectedTrainingIri
    ? trainingBreakdown.find((item) => item.training['@id'] === selectedTrainingIri) ?? null
    : null;

  const allModeCards = useMemo(() => {
    if (!statsOverview) {
      return [] as CardDefinition[];
    }

    return [
      buildCard('Taux de réussite', `${statsOverview.successRate}%`, <AppIcons.TargetIcon width={20} height={20} />, 'info'),
      buildCard('Progression globale', `${statsOverview.progressPercent ?? 0}%`, <AppIcons.TrendUpIcon width={20} height={20} />, 'positive'),
      buildCard("Temps d'entraînement", formatDuration(statsOverview.totalDurationMilliseconds ?? 0), <AppIcons.HistoryIcon width={20} height={20} />, 'info'),
      buildCard('Tentatives moyennes', formatAverageAttempts(statsOverview.averageAttempts ?? 0), <AppIcons.RepeatIcon width={20} height={20} />, 'violet'),
    ];
  }, [statsOverview]);

  const cycleRows = useMemo(() => filterCycleRows(summary, selectedDays), [summary, selectedDays]);
  const selectedModeCards = useMemo(() => buildSelectedCards(cycleRows, selectedSummary), [cycleRows, selectedSummary]);
  const cycleMetricPoints = useMemo(() => buildCycleMetricPoints(cycleRows, selectedMetric), [cycleRows, selectedMetric]);
  const cycleTimePoints = useMemo(() => buildCycleTimePoints(cycleRows), [cycleRows]);
  const attemptScopeOptions = useMemo(
    () => [{ label: 'Tous les cycles', value: 'all' }, ...cycleRows.map((cycle) => ({ label: `Cycle ${cycle.cycle.number}`, value: cycle.cycle['@id'] }))],
    [cycleRows],
  );
  const effectiveAttemptScope = attemptScopeOptions.some((option) => option.value === selectedAttemptScope)
    ? selectedAttemptScope
    : 'all';
  const attemptCycleRows = useMemo(
    () => effectiveAttemptScope === 'all'
      ? cycleRows
      : cycleRows.filter((cycle) => cycle.cycle['@id'] === effectiveAttemptScope),
    [cycleRows, effectiveAttemptScope],
  );
  const mostActiveRows = useMemo(
    () => [...trainingBreakdown].sort((left, right) => (right.durationMilliseconds ?? 0) - (left.durationMilliseconds ?? 0)).slice(0, 5),
    [trainingBreakdown],
  );
  const globalResultBreakdown = useMemo(
    () => buildResultBreakdown({
      failedCount: statsOverview?.failedCyclePuzzleCount,
      rescuedCount: statsOverview?.rescuedCyclePuzzleCount,
      solvedCount: statsOverview?.solvedCyclePuzzleCount,
      unresolvedCount: statsOverview?.unresolvedCyclePuzzleCount,
    }),
    [statsOverview],
  );
  const activeMetricLabel = METRIC_OPTIONS.find((option) => option.key === selectedMetric)?.label ?? 'Taux de réussite';
  const metricValues = cycleMetricPoints.map((point) => point.value);
  const metricMax = selectedMetric === 'averageAttempts' ? getAdaptiveNumericMax(metricValues, 1) : 100;
  const metricGrid = selectedMetric === 'averageAttempts'
    ? [0, metricMax * 0.33, metricMax * 0.66, metricMax].map((value) => Math.round(value * 10) / 10)
    : [...PERCENT_GRID];
  const timeValues = cycleTimePoints.map((point) => point.value);
  const timeMax = getAdaptiveTimeMax(timeValues);
  const timeGrid = [0, timeMax * 0.25, timeMax * 0.5, timeMax * 0.75, timeMax];

  return (
    <div className="wp-page wp-training-stats-page">
      <header className="wp-training-stats-page__header">
        <div>
          <h1>Statistiques</h1>
          <p>Analysez votre activité et votre progression.</p>
        </div>

        <div className="wp-training-stats-page__filters">
          <label className="wp-training-stats-select">
            <span className="wp-training-stats-select__icon"><FilterIcon /></span>
            <select value={selectedTrainingIri ?? 'all'} onChange={(event) => onSelectTrainingIri(event.target.value === 'all' ? null : event.target.value)}>
              <option value="all">Tous les trainings</option>
              {trainingBreakdown.map((item) => (
                <option key={item.training['@id']} value={item.training['@id']}>{item.training.name}</option>
              ))}
            </select>
          </label>

          {!selectedSummary ? (
            <label className="wp-training-stats-select">
              <span><AppIcons.HistoryIcon width={18} height={18} /></span>
              <select value={String(selectedDays)} onChange={(event) => setSelectedDays(Number(event.target.value) as (typeof PERIOD_OPTIONS)[number]['value'])}>
                {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ) : null}
        </div>
      </header>

      {isLoading ? <p className="wp-empty">Chargement des statistiques...</p> : null}
      {isError && errorMessage ? <p className="alert error-alert">{errorMessage}</p> : null}
      {selectedSummary && summaryIsLoading ? <p className="wp-empty">Chargement du détail de l'entraînement...</p> : null}
      {selectedSummary && summaryIsError && summaryError ? <p className="alert error-alert">{summaryError}</p> : null}

      <section className="wp-training-stats-cards">
        {(selectedSummary ? selectedModeCards : allModeCards).map((card) => (
          <article key={card.label} className={`wp-training-stats-card is-${card.accent}`}>
            <div className="wp-training-stats-card__head">
              <span className="wp-training-stats-card__icon">{card.icon}</span>
              <span>{card.label}</span>
            </div>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      {selectedSummary ? (
        <>
          <section className="wp-training-stats-grid wp-training-stats-grid--selected-top">
            <article className="wp-training-stats-panel">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Évolution des cycles</h2>
                  <p>Suivez l'évolution de vos performances au fil des cycles.</p>
                </div>
                <label className="wp-training-stats-select wp-training-stats-select--compact">
                  <span><MetricIcon metric={selectedMetric} /></span>
                  <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as StatsMetricKey)}>
                    {METRIC_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                  </select>
                </label>
              </div>
              <GenericLineChart
                accentClassName={selectedMetric === 'averageAttempts' ? 'is-violet' : 'is-blue'}
                emptyMessage="Aucun cycle disponible sur cette période."
                formatTooltipValue={(value) => selectedMetric === 'averageAttempts' ? formatAverageAttempts(value) : `${Math.round(value)}%`}
                gridValues={metricGrid}
                metricLabel={activeMetricLabel}
                points={cycleMetricPoints}
              />
            </article>

            <article className="wp-training-stats-panel">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Temps moyen par puzzle sur chaque cycle</h2>
                  <p>Évolution du temps moyen pour résoudre un puzzle à chaque cycle.</p>
                </div>
              </div>
              <GenericLineChart
                accentClassName="is-violet"
                emptyMessage="Aucun puzzle résolu sur cette période."
                formatTooltipValue={formatAveragePuzzleTime}
                gridValues={timeGrid}
                metricLabel="Temps moyen"
                points={cycleTimePoints}
              />
            </article>
          </section>

          <section className="wp-training-stats-grid wp-training-stats-grid--selected-detail">
            <article className="wp-training-stats-panel wp-training-stats-panel--span-2">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Détail des cycles</h2>
                  <p>Données détaillées de chaque cycle.</p>
                </div>
              </div>
              {cycleRows.length === 0 ? (
                <ChartEmpty message="Aucun cycle disponible sur cette période." />
              ) : (
                <div className="wp-training-stats-table-wrap">
                  <table className="wp-training-stats-table">
                    <thead>
                      <tr>
                        <th>Cycle</th>
                        <th>Période</th>
                        <th>Réussite</th>
                        <th>Progression</th>
                        <th>Tentatives moy.</th>
                        <th>Temps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cycleRows.map((cycle) => (
                        <tr key={cycle.cycle['@id']}>
                          <td>{`Cycle ${cycle.cycle.number}`}</td>
                          <td>
                            <div className="wp-training-stats-cycle-period">
                              <span>{formatCyclePeriod(cycle)}</span>
                              {cycle.cycle.status === 'active' ? <em>En cours</em> : null}
                            </div>
                          </td>
                          <td>{`${Math.round(cycle.successRate ?? 0)}%`}</td>
                          <td>{`${Math.round(cycle.progressPercent ?? 0)}%`}</td>
                          <td>{formatAverageAttempts(cycle.averageAttempts ?? 0)}</td>
                          <td>{formatDuration(cycle.durationMilliseconds ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </section>

          <section className="wp-training-stats-grid wp-training-stats-grid--selected-bottom">
            <article className="wp-training-stats-panel">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Répartition des résultats par cycle</h2>
                  <p>Barres verticales compactes comme sur la maquette.</p>
                </div>
              </div>
              <CycleResultColumns cycleRows={cycleRows} />
            </article>

            <article className="wp-training-stats-panel">
              <div className="wp-training-stats-panel__head">
                <div>
                  <h2>Distribution du nombre d'essais</h2>
                  <p>Fromage avec valeurs affichées sur le côté.</p>
                </div>
                <label className="wp-training-stats-select wp-training-stats-select--compact">
                  <span><AppIcons.RepeatIcon width={18} height={18} /></span>
                  <select value={effectiveAttemptScope} onChange={(event) => setSelectedAttemptScope(event.target.value)}>
                    {attemptScopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
              <AttemptDistribution summary={summary} cycleRows={attemptCycleRows} preferSummary={effectiveAttemptScope === 'all'} />
            </article>
          </section>
        </>
      ) : (
        <section className="wp-training-stats-grid wp-training-stats-grid--global">
          <article className="wp-training-stats-panel wp-training-stats-panel--span-2">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Trainings les plus actifs</h2>
                <p>Liste tabulaire avec training, temps, difficulté moyenne, réussite globale et progression depuis le début.</p>
              </div>
            </div>
            <div className="wp-training-stats-table-wrap">
              {mostActiveRows.length === 0 ? <ChartEmpty message="Aucune activité pour le moment." /> : (
                <table className="wp-training-stats-table wp-training-stats-table--interactive">
                  <thead>
                    <tr>
                      <th>Training</th>
                      <th>Temps</th>
                      <th>Difficulté moy.</th>
                      <th>Réussite</th>
                      <th>Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostActiveRows.map((row) => (
                      <tr key={row.training['@id']} onClick={() => onOpenTraining(row.training['@id'], 'stats')}>
                        <td><TrainingCell training={row.training} /></td>
                        <td>{formatDuration(row.durationMilliseconds ?? 0)}</td>
                        <td>—</td>
                        <td>{`${row.successRate ?? 0}%`}</td>
                        <td>{`${row.progressPercent ?? 0}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Répartition du temps par training</h2>
                <p>Fromage avec durée totale au centre, puis pourcentage et durée réelle par training.</p>
              </div>
              {trainingBreakdown.length > 5 ? <span className="wp-training-stats-panel__action">Voir tout</span> : null}
            </div>
            <TrainingTimeDistribution rows={trainingBreakdown} />
          </article>

          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Répartition des résultats</h2>
                <p>Fromage de synthèse pour réussite directe, rattrapage et non-résolution.</p>
              </div>
            </div>
            <ResultDistribution
              breakdown={globalResultBreakdown}
              totalLabel="Puzzles terminés"
              totalValue={(globalResultBreakdown.direct + globalResultBreakdown.rescued + globalResultBreakdown.unresolved).toLocaleString('fr-FR')}
            />
          </article>
        </section>
      )}
    </div>
  );
}

export type { TrainingsStatsViewProps };
export default TrainingsStatsView;






