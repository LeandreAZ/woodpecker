import { resolveTrainingBranding } from '../../trainings/components/identity/TrainingBranding';
import type { TrainingCycleSummary, TrainingDashboardSummary, TrainingSummary } from '../../trainings/types/training.types';
import { formatStatsDuration } from '../../trainings/utils/training.utils';
import type { CyclePoint, DistributionSegment, ResultBreakdown, StatsMetricKey } from '../types/statisticsView.types';

export const PERIOD_OPTIONS = [
  { label: '7 derniers jours', value: 7 },
  { label: '14 derniers jours', value: 14 },
  { label: '30 derniers jours', value: 30 },
  { label: '60 derniers jours', value: 60 },
  { label: '90 derniers jours', value: 90 },
] as const;

export const PERCENT_GRID = [0, 25, 50, 75, 100] as const;

export const METRIC_OPTIONS: Array<{ key: StatsMetricKey; label: string }> = [
  { key: 'successRate', label: 'Taux de réussite' },
  { key: 'averageAttempts', label: 'Tentatives moyennes' },
  { key: 'trainingTime', label: "Temps d'entraînement" },
];

export const NEUTRAL_TRAINING_COLOR = '#41597f';

export const RESULT_COLORS = {
  direct: '#22c55e',
  rescued: '#f59e0b',
  unresolved: '#ef4444',
} as const;

export const ATTEMPT_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'] as const;

export function getAdaptiveNumericMax(values: number[], minimum = 1) {
  const maxValue = Math.max(...values.filter((value) => Number.isFinite(value) && value > 0), 0);
  if (maxValue <= minimum) {
    return minimum;
  }

  return maxValue * 1.15;
}

export function getAdaptiveTimeMax(values: number[]) {
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

export function getAdaptiveDurationMax(values: number[]) {
  const maxValue = Math.max(...values.filter((value) => value > 0), 0);
  if (maxValue <= 0) return 60000;
  const padded = maxValue * 1.15;
  if (padded <= 60000) return 60000;
  if (padded <= 3600000) return Math.ceil(padded / 60000) * 60000;
  return Math.ceil(padded / 1800000) * 1800000;
}

export function sortCycleRowsChronologically(cycleRows: TrainingCycleSummary[]) {
  return [...cycleRows].sort((left, right) => left.cycle.number - right.cycle.number);
}

export function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function addDays(value: Date, offset: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + offset);
  return next;
}

export function resolveCycleDate(cycle: TrainingCycleSummary) {
  const source = cycle.cycle.completedAt ?? cycle.cycle.startedAt;
  if (!source) {
    return null;
  }

  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function filterCycleRows(summary: TrainingSummary | null, days: number) {
  const source = [...(summary?.cycleSummaries ?? [])].sort((left, right) => right.cycle.number - left.cycle.number);
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

export function hasCycleActivity(cycle: TrainingCycleSummary) {
  return cycle.solved > 0 || cycle.failed > 0;
}

export function buildCycleMetricPoints(cycleRows: TrainingCycleSummary[], metric: StatsMetricKey): CyclePoint[] {
  return cycleRows.filter(hasCycleActivity).map((cycle) => ({
    label: 'Cycle ' + String(cycle.cycle.number),
    value: metric === 'averageAttempts'
      ? cycle.averageAttempts ?? 0
      : metric === 'trainingTime'
        ? cycle.durationMilliseconds ?? 0
        : cycle.successRate ?? 0,
  }));
}

export function buildCycleTimePoints(cycleRows: TrainingCycleSummary[]): CyclePoint[] {
  return cycleRows
    .filter(hasCycleActivity)
    .map((cycle) => ({
      label: 'Cycle ' + String(cycle.cycle.number),
      value: ((cycle.durationMilliseconds ?? 0) / Math.max(cycle.completedPuzzleCount ?? 1, 1)) / 1000,
    }));
}

export function buildResultBreakdown(source: {
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

export function buildCycleResultBreakdown(cycle: TrainingCycleSummary): ResultBreakdown {
  return buildResultBreakdown({
    failedCount: cycle.failed,
    rescuedCount: cycle.rescuedCount,
    solvedCount: cycle.solved,
    unresolvedCount: cycle.unresolvedCount,
  });
}

export function buildAttemptDistribution(summary: TrainingSummary | null, cycleRows: TrainingCycleSummary[], preferSummary = true) {
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

export function buildDonutBackground(segments: DistributionSegment[], trackColor = 'rgba(54, 74, 102, 0.58)') {
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

export function buildTrainingTimeDistribution(rows: TrainingDashboardSummary[], maxVisibleRows: number | null = 5) {
  const activeRows = [...rows]
    .filter((row) => (row.durationMilliseconds ?? 0) > 0)
    .sort((left, right) => (right.durationMilliseconds ?? 0) - (left.durationMilliseconds ?? 0));

  if (activeRows.length === 0) {
    return null;
  }

  const fallbackRows = rows.filter((row) => !activeRows.some((activeRow) => activeRow.training['@id'] === row.training['@id']));
  const orderedRows = [...activeRows, ...fallbackRows];
  const visibleRows = maxVisibleRows === null ? orderedRows : orderedRows.slice(0, maxVisibleRows);
  const totalDuration = activeRows.reduce((sum, row) => sum + (row.durationMilliseconds ?? 0), 0);
  const hiddenDuration = maxVisibleRows === null
    ? 0
    : activeRows
      .filter((row) => !visibleRows.some((visibleRow) => visibleRow.training['@id'] === row.training['@id']))
      .reduce((sum, row) => sum + (row.durationMilliseconds ?? 0), 0);
  const segments = visibleRows.map((row) => ({
    color: resolveTrainingBranding(row.training).iconBackgroundColor ?? NEUTRAL_TRAINING_COLOR,
    label: row.training.name,
    value: row.durationMilliseconds ?? 0,
    valueLabel: formatStatsDuration(row.durationMilliseconds ?? 0),
  }));

  return {
    segments: hiddenDuration > 0
      ? [...segments, { color: NEUTRAL_TRAINING_COLOR, label: 'Autres', value: hiddenDuration, valueLabel: formatStatsDuration(hiddenDuration) }]
      : segments,
    totalDuration,
  };
}
