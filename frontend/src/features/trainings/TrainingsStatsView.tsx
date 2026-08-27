import { useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import * as AppIcons from '../../shared/AppIcons';
import { TrainingLogoBadge, resolveTrainingBranding } from './TrainingBranding';
import { formatDuration } from './trainingsUtils';
import type {
  DailyActivityPoint,
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

type StatsMetricKey = 'successRate' | 'progressPercent';

type WindowActivitySummary = {
  activeDays: number;
  averageAttempts: number;
  durationMilliseconds: number;
  handledPuzzleCount: number;
  progressPercent: number;
  successRate: number;
};

type CardDefinition = {
  deltaLabel: string;
  deltaTone: 'is-negative' | 'is-neutral' | 'is-positive';
  icon: ReactElement;
  label: string;
  value: string;
};

type CycleSlot = {
  cycle: TrainingCycleSummary | null;
  label: string;
  value: number | null;
};

const PERIOD_OPTIONS = [7, 14, 30, 90] as const;
const PERCENT_GRID = [0, 25, 50, 75, 100] as const;
const SLOT_COUNT = 5;
const METRIC_OPTIONS: Array<{ key: StatsMetricKey; label: string }> = [
  { key: 'successRate', label: 'Taux de réussite' },
  { key: 'progressPercent', label: 'Progression' },
];

function iconElement(element: ReactElement) {
  return element;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toDateKey(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, offset: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + offset);
  return next;
}

function differenceInDays(from: Date, to: Date) {
  return Math.max(1, Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000) + 1);
}

function buildRange(points: DailyActivityPoint[], startDate: Date, endDate: Date) {
  const startKey = toDateKey(startDate.toISOString())!;
  const endKey = toDateKey(endDate.toISOString())!;
  return points.filter((point) => point.date >= startKey && point.date <= endKey);
}

function resolveAvailableDays(allDates: Array<string | null | undefined>, fallbackDate?: string | null) {
  const validDates = allDates
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));

  if (fallbackDate) {
    const fallback = new Date(fallbackDate);
    if (!Number.isNaN(fallback.getTime())) {
      validDates.push(fallback);
    }
  }

  if (validDates.length === 0) {
    return 7;
  }

  const earliest = validDates.reduce((current, value) => (value < current ? value : current));
  return differenceInDays(earliest, new Date());
}

function buildWindowSummary(points: DailyActivityPoint[], puzzleCount: number): WindowActivitySummary {
  const attemptCount = points.reduce((total, point) => total + (point.attemptCount ?? 0), 0);
  const successfulAttemptCount = points.reduce((total, point) => total + (point.successfulAttemptCount ?? 0), 0);
  const handledPuzzleCount = points.reduce((total, point) => total + (point.handledPuzzleCount ?? 0), 0);
  const durationMilliseconds = points.reduce((total, point) => total + (point.durationMilliseconds ?? 0), 0);
  const progressPercent = puzzleCount > 0 ? clampPercent((handledPuzzleCount / puzzleCount) * 100) : 0;
  const averageAttempts = handledPuzzleCount > 0 ? Math.round((attemptCount / handledPuzzleCount) * 10) / 10 : 0;
  const successRate = attemptCount > 0 ? clampPercent((successfulAttemptCount / attemptCount) * 100) : 0;
  const activeDays = points.filter((point) => (point.attemptCount ?? 0) > 0 || (point.durationMilliseconds ?? 0) > 0).length;

  return {
    activeDays,
    averageAttempts,
    durationMilliseconds,
    handledPuzzleCount,
    progressPercent,
    successRate,
  };
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

function formatDelta(value: number, unit: 'count' | 'duration' | 'percent') {
  const rounded = unit === 'count' ? Math.round(value * 10) / 10 : Math.round(value);
  if (rounded === 0) {
    return 'Stable';
  }

  const prefix = rounded > 0 ? '+' : '-';
  const absolute = Math.abs(rounded);

  if (unit === 'duration') {
    return `${prefix}${formatDuration(absolute)}`;
  }

  if (unit === 'percent') {
    return `${prefix}${absolute}%`;
  }

  return `${prefix}${absolute}`;
}

function getDeltaTone(value: number): 'is-negative' | 'is-neutral' | 'is-positive' {
  if (value > 0) return 'is-positive';
  if (value < 0) return 'is-negative';
  return 'is-neutral';
}

function buildCard(label: string, value: string, deltaValue: number, deltaUnit: 'count' | 'duration' | 'percent', icon: ReactElement): CardDefinition {
  return {
    deltaLabel: formatDelta(deltaValue, deltaUnit),
    deltaTone: getDeltaTone(deltaValue),
    icon,
    label,
    value,
  };
}

function truncateLabel(value: string, maxLength = 18) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3)}...`;
}

function formatAveragePuzzleTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0 ? `${minutes}m${remainingSeconds}s` : `${minutes}m`;
}

function formatAxisDuration(seconds: number) {
  if (seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = seconds / 60;
  return minutes >= 10 || Number.isInteger(minutes) ? `${Math.round(minutes)}m` : `${minutes.toFixed(1)}m`;
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

function buildCycleRows(summary: TrainingSummary | null, windowStartDate: Date) {
  const source = [...(summary?.cycleSummaries ?? [])].sort((left, right) => left.cycle.number - right.cycle.number);
  const filtered = source.filter((item) => {
    const startedAt = item.cycle.startedAt ?? item.cycle.completedAt;
    if (!startedAt) {
      return false;
    }
    const date = new Date(startedAt);
    return !Number.isNaN(date.getTime()) && date >= windowStartDate;
  });
  return (filtered.length > 0 ? filtered : source).slice(-SLOT_COUNT);
}

function buildCycleSlots(rows: TrainingCycleSummary[], metric: StatsMetricKey): CycleSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, index) => {
    const cycle = rows[index] ?? null;
    return {
      cycle,
      label: cycle ? `Cycle ${cycle.cycle.number}` : `Cycle ${index + 1}`,
      value: cycle ? (metric === 'successRate' ? cycle.successRate ?? 0 : cycle.progressPercent ?? 0) : null,
    };
  });
}

function buildTimeSlots(rows: TrainingCycleSummary[]): CycleSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, index) => {
    const cycle = rows[index] ?? null;
    const handled = cycle ? Math.max(cycle.solved + cycle.failed, 1) : 1;
    return {
      cycle,
      label: cycle ? `Cycle ${cycle.cycle.number}` : `Cycle ${index + 1}`,
      value: cycle ? (cycle.durationMilliseconds ?? 0) / handled / 1000 : null,
    };
  });
}

function buildAllTrainingsActivityRows(summaries: TrainingDashboardSummary[], days: number) {
  const endDate = startOfDay(new Date());
  const startDate = addDays(endDate, -(days - 1));

  return summaries.map((summary) => {
    const points = buildRange(summary.dailyActivity ?? [], startDate, endDate);
    const stats = buildWindowSummary(points, summary.puzzleCount ?? 0);
    const progressPerHour = stats.durationMilliseconds > 0
      ? Math.round((stats.progressPercent / (stats.durationMilliseconds / 3600000)) * 10) / 10
      : 0;

    return { progressPerHour, stats, summary };
  });
}
function ChartEmpty({ message }: { message: string }) {
  return <div className="wp-training-stats-chart__empty">{message}</div>;
}

function PercentLineChart({ emptyMessage, metricLabel, slots }: { emptyMessage: string; metricLabel: string; slots: CycleSlot[] }) {
  const viewBoxWidth = 520;
  const viewBoxHeight = 260;
  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 18;
  const paddingBottom = 36;
  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom;
  const zoneWidth = chartWidth / SLOT_COUNT;
  const points = slots
    .map((slot, index) => {
      if (slot.value === null) {
        return null;
      }
      const x = paddingLeft + zoneWidth * index + zoneWidth / 2;
      const y = paddingTop + chartHeight - (slot.value / 100) * chartHeight;
      return { x, y, label: slot.label };
    })
    .filter((point): point is { x: number; y: number; label: string } => point !== null);

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="wp-training-stats-chart">
      <div className="wp-training-stats-chart__header-inline">{metricLabel}</div>
      <div className="wp-training-stats-chart__canvas">
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="none" aria-label={metricLabel}>
          {PERCENT_GRID.map((tick) => {
            const y = paddingTop + chartHeight - (tick / 100) * chartHeight;
            return (
              <g key={tick}>
                <line className="wp-training-stats-chart__grid" x1={paddingLeft} x2={viewBoxWidth - paddingRight} y1={y} y2={y} />
                <text className="wp-training-stats-chart__axis-label" x={8} y={y + 4}>{tick}%</text>
              </g>
            );
          })}

          {slots.map((slot, index) => {
            const x = paddingLeft + zoneWidth * index + zoneWidth / 2;
            return <line key={slot.label} className="wp-training-stats-chart__axis" x1={x} x2={x} y1={paddingTop} y2={paddingTop + chartHeight} />;
          })}

          {points.length > 1 ? <path className="wp-training-stats-chart__line" d={path} /> : null}
          {points.map((point) => <circle key={point.label} className="wp-training-stats-chart__dot" cx={point.x} cy={point.y} r="5" />)}

          {points.length === 0 ? (
            <foreignObject x={paddingLeft} y={paddingTop} width={chartWidth} height={chartHeight}>
              <ChartEmpty message={emptyMessage} />
            </foreignObject>
          ) : null}
        </svg>
      </div>
      <div className="wp-training-stats-chart__x-axis">
        {slots.map((slot) => <span key={slot.label}>{slot.label}</span>)}
      </div>
    </div>
  );
}

function AverageTimeBarChart({ emptyMessage, slots }: { emptyMessage: string; slots: CycleSlot[] }) {
  const values = slots.map((slot) => slot.value ?? 0);
  const maxSeconds = getAdaptiveTimeMax(values);
  const ticks = [0, maxSeconds * 0.25, maxSeconds * 0.5, maxSeconds * 0.75, maxSeconds];

  return (
    <div className="wp-training-stats-bars">
      <div className="wp-training-stats-bars__plot">
        <div className="wp-training-stats-bars__y-axis">
          {ticks.slice().reverse().map((tick) => <span key={tick}>{formatAxisDuration(tick)}</span>)}
        </div>
        <div className="wp-training-stats-bars__grid">
          {ticks.slice().reverse().map((tick) => <span key={tick} className="wp-training-stats-bars__grid-line" />)}
          {slots.every((slot) => slot.value === null) ? <ChartEmpty message={emptyMessage} /> : null}
          <div className="wp-training-stats-bars__columns">
            {slots.map((slot) => {
              const heightPercent = slot.value === null ? 0 : Math.max(0, Math.min(100, (slot.value / maxSeconds) * 100));
              const style = { '--bar-height': `${heightPercent}%` } as CSSProperties;
              return (
                <div className="wp-training-stats-bars__column" key={slot.label}>
                  <span className="wp-training-stats-bars__value">{slot.value === null ? '' : formatAveragePuzzleTime(slot.value)}</span>
                  <span className="wp-training-stats-bars__bar" style={style} />
                  <strong>{slot.label}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScatterPlot({ rows }: { rows: ReturnType<typeof buildAllTrainingsActivityRows> }) {
  const plottedRows = rows.filter((row) => row.stats.durationMilliseconds > 0 || row.stats.progressPercent > 0);
  const maxDuration = Math.max(...plottedRows.map((row) => row.stats.durationMilliseconds), 1);

  return (
    <div className="wp-training-stats-scatter">
      <svg viewBox="0 0 620 260" preserveAspectRatio="none" aria-label="Temps investi et progression obtenue">
        <line className="wp-training-stats-scatter__axis" x1="52" x2="52" y1="20" y2="220" />
        <line className="wp-training-stats-scatter__axis" x1="52" x2="590" y1="220" y2="220" />
        {PERCENT_GRID.map((tick) => {
          const y = 220 - tick * 2;
          return (
            <g key={tick}>
              <line className="wp-training-stats-scatter__grid" x1="52" x2="590" y1={y} y2={y} />
              <text className="wp-training-stats-scatter__label" x="8" y={y + 4}>{tick}%</text>
            </g>
          );
        })}

        {plottedRows.map(({ stats, summary }) => {
          const x = 52 + (stats.durationMilliseconds / maxDuration) * 538;
          const y = 220 - stats.progressPercent * 2;
          const color = resolveTrainingBranding(summary.training).iconBackgroundColor;
          return (
            <g key={summary.training['@id']}>
              <circle cx={x} cy={y} r="6" fill={color} />
              <text className="wp-training-stats-scatter__name" x={Math.min(540, x + 10)} y={Math.max(24, y - 8)}>{truncateLabel(summary.training.name, 16)}</text>
              <title>{`${summary.training.name} · ${formatDuration(stats.durationMilliseconds)} · ${stats.progressPercent}%`}</title>
            </g>
          );
        })}

        {plottedRows.length === 0 ? (
          <foreignObject x="52" y="20" width="538" height="200">
            <ChartEmpty message="Aucune donnée exploitable sur cette période." />
          </foreignObject>
        ) : null}
      </svg>
      <div className="wp-training-stats-scatter__meta">
        <span>Progression obtenue</span>
        <span>Temps investi</span>
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
  const [selectedDays, setSelectedDays] = useState<(typeof PERIOD_OPTIONS)[number]>(30);
  const [selectedMetric, setSelectedMetric] = useState<StatsMetricKey>('successRate');
  const trainingBreakdown = statsOverview?.trainingBreakdown ?? [];
  const selectedSummary = selectedTrainingIri
    ? trainingBreakdown.find((item) => item.training['@id'] === selectedTrainingIri) ?? null
    : null;

  const availableDays = useMemo(() => {
    if (selectedSummary) {
      const dates = (summary?.dailyActivity ?? []).map((point) => point.date);
      return resolveAvailableDays(dates, selectedSummary.training.createdAt);
    }

    const dates = trainingBreakdown.flatMap((item) => (item.dailyActivity ?? []).map((point) => point.date));
    const createdAtDates = trainingBreakdown.map((item) => item.training.createdAt);
    return resolveAvailableDays([...dates, ...createdAtDates]);
  }, [selectedSummary, summary?.dailyActivity, trainingBreakdown]);

  const effectiveDays = Math.min(selectedDays, availableDays);
  const endDate = startOfDay(new Date());
  const windowStartDate = addDays(endDate, -(effectiveDays - 1));
  const previousEndDate = addDays(windowStartDate, -1);
  const previousStartDate = addDays(previousEndDate, -(effectiveDays - 1));

  const allRows = useMemo(() => buildAllTrainingsActivityRows(trainingBreakdown, effectiveDays), [effectiveDays, trainingBreakdown]);

  const allModeCards = useMemo(() => {
    if (allRows.length === 0) {
      return [] as CardDefinition[];
    }

    const currentSuccess = allRows.reduce((total, item) => total + item.stats.successRate, 0) / allRows.length;
    const currentProgress = allRows.reduce((total, item) => total + item.stats.progressPercent, 0) / allRows.length;
    const currentDuration = allRows.reduce((total, item) => total + item.stats.durationMilliseconds, 0) / allRows.length;
    const currentAttempts = allRows.reduce((total, item) => total + item.stats.averageAttempts, 0) / allRows.length;

    const previousRows = trainingBreakdown.map((item) => {
      const previousPoints = buildRange(item.dailyActivity ?? [], previousStartDate, previousEndDate);
      return buildWindowSummary(previousPoints, item.puzzleCount ?? 0);
    });

    const previousSuccess = previousRows.reduce((total, item) => total + item.successRate, 0) / Math.max(previousRows.length, 1);
    const previousProgress = previousRows.reduce((total, item) => total + item.progressPercent, 0) / Math.max(previousRows.length, 1);
    const previousDuration = previousRows.reduce((total, item) => total + item.durationMilliseconds, 0) / Math.max(previousRows.length, 1);
    const previousAttempts = previousRows.reduce((total, item) => total + item.averageAttempts, 0) / Math.max(previousRows.length, 1);

    return [
      buildCard('Taux de réussite', `${Math.round(currentSuccess)}%`, currentSuccess - previousSuccess, 'percent', iconElement(<AppIcons.TargetIcon width={20} height={20} />)),
      buildCard('Progression globale', `${Math.round(currentProgress)}%`, currentProgress - previousProgress, 'percent', iconElement(<AppIcons.TrendUpIcon width={20} height={20} />)),
      buildCard("Temps d'entraînement", formatDuration(currentDuration), currentDuration - previousDuration, 'duration', iconElement(<AppIcons.HistoryIcon width={20} height={20} />)),
      buildCard('Tentatives moyennes', `${Math.round(currentAttempts * 10) / 10}`, currentAttempts - previousAttempts, 'count', iconElement(<AppIcons.RepeatIcon width={20} height={20} />)),
    ];
  }, [allRows, previousEndDate, previousStartDate, trainingBreakdown]);

  const selectedCurrent = selectedSummary
    ? buildWindowSummary(buildRange(summary?.dailyActivity ?? [], windowStartDate, endDate), summary?.puzzleCount ?? selectedSummary.puzzleCount ?? 0)
    : null;
  const selectedPrevious = selectedSummary
    ? buildWindowSummary(buildRange(summary?.dailyActivity ?? [], previousStartDate, previousEndDate), summary?.puzzleCount ?? selectedSummary.puzzleCount ?? 0)
    : null;

  const selectedModeCards = selectedSummary && selectedCurrent && selectedPrevious
    ? [
        buildCard('Taux de réussite', `${Math.round(selectedCurrent.successRate)}%`, selectedCurrent.successRate - selectedPrevious.successRate, 'percent', iconElement(<AppIcons.TargetIcon width={20} height={20} />)),
        buildCard('Progression globale', `${Math.round(selectedCurrent.progressPercent)}%`, selectedCurrent.progressPercent - selectedPrevious.progressPercent, 'percent', iconElement(<AppIcons.TrendUpIcon width={20} height={20} />)),
        buildCard("Temps d'entraînement", formatDuration(selectedCurrent.durationMilliseconds), selectedCurrent.durationMilliseconds - selectedPrevious.durationMilliseconds, 'duration', iconElement(<AppIcons.HistoryIcon width={20} height={20} />)),
        buildCard('Tentatives moyennes', `${Math.round(selectedCurrent.averageAttempts * 10) / 10}`, selectedCurrent.averageAttempts - selectedPrevious.averageAttempts, 'count', iconElement(<AppIcons.RepeatIcon width={20} height={20} />)),
      ]
    : [];

  const cycleRows = useMemo(() => buildCycleRows(summary, windowStartDate), [summary, windowStartDate]);
  const cyclePercentSlots = useMemo(() => buildCycleSlots(cycleRows, selectedMetric), [cycleRows, selectedMetric]);
  const cycleTimeSlots = useMemo(() => buildTimeSlots(cycleRows), [cycleRows]);
  const mostActiveRows = [...allRows].sort((left, right) => right.stats.durationMilliseconds - left.stats.durationMilliseconds).slice(0, 5);
  const regularRows = [...allRows].sort((left, right) => right.stats.activeDays - left.stats.activeDays || right.stats.handledPuzzleCount - left.stats.handledPuzzleCount).slice(0, 5);
  const distributionTotal = Math.max(allRows.reduce((total, row) => total + row.stats.durationMilliseconds, 0), 1);
  const distributionRows = [...allRows].filter((row) => row.stats.durationMilliseconds > 0).sort((left, right) => right.stats.durationMilliseconds - left.stats.durationMilliseconds).slice(0, 5);
  const activeMetricLabel = METRIC_OPTIONS.find((option) => option.key === selectedMetric)?.label ?? 'Taux de réussite';

  return (
    <div className="wp-page wp-training-stats-page">
      <header className="wp-training-stats-page__header">
        <div>
          <h1>{selectedSummary ? `Statistiques · ${selectedSummary.training.name}` : 'Statistiques · Tous les trainings'}</h1>
          <p>Des repères concrets pour voir ce qui progresse, ce qui coûte du temps et ce qu'il faut retravailler.</p>
        </div>

        <div className="wp-training-stats-page__filters">
          <label className="wp-training-stats-select">
            <span><AppIcons.BarsIcon width={18} height={18} /></span>
            <select value={selectedTrainingIri ?? 'all'} onChange={(event) => onSelectTrainingIri(event.target.value === 'all' ? null : event.target.value)}>
              <option value="all">Tous les trainings</option>
              {trainingBreakdown.map((item) => (
                <option key={item.training['@id']} value={item.training['@id']}>{item.training.name}</option>
              ))}
            </select>
          </label>

          <label className="wp-training-stats-select">
            <span><AppIcons.HistoryIcon width={18} height={18} /></span>
            <select value={String(selectedDays)} onChange={(event) => setSelectedDays(Number(event.target.value) as (typeof PERIOD_OPTIONS)[number])}>
              {PERIOD_OPTIONS.map((option) => <option key={option} value={option}>{`${option} derniers jours`}</option>)}
            </select>
          </label>
        </div>
      </header>

      {isLoading ? <p className="wp-empty">Chargement des statistiques...</p> : null}
      {isError && errorMessage ? <p className="alert error-alert">{errorMessage}</p> : null}
      {selectedSummary && summaryIsLoading ? <p className="wp-empty">Chargement du détail de l'entraînement...</p> : null}
      {selectedSummary && summaryIsError && summaryError ? <p className="alert error-alert">{summaryError}</p> : null}

      <section className="wp-training-stats-cards">
        {(selectedSummary ? selectedModeCards : allModeCards).map((card) => (
          <article className="wp-training-stats-card" key={card.label}>
            <div className="wp-training-stats-card__head">
              <span className="wp-training-stats-card__icon">{card.icon}</span>
              <span>{card.label}</span>
            </div>
            <strong>{card.value}</strong>
            <small className={card.deltaTone}>{card.deltaLabel}</small>
          </article>
        ))}
      </section>

      {selectedSummary ? (
        <section className="wp-training-stats-grid wp-training-stats-grid--selected">
          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Évolution des cycles</h2>
                <p>Suivi de vos performances au fil des cycles.</p>
              </div>
              <label className="wp-training-stats-select wp-training-stats-select--compact">
                <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as StatsMetricKey)}>
                  {METRIC_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                </select>
              </label>
            </div>
            <PercentLineChart emptyMessage="Aucun cycle disponible sur cette période." metricLabel={activeMetricLabel} slots={cyclePercentSlots} />
          </article>

          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Détail des cycles</h2>
                <p>Lecture détaillée des cycles visibles sur la période sélectionnée.</p>
              </div>
            </div>

            {cycleRows.length === 0 ? (
              <div className="wp-training-stats-empty-block">Aucun cycle disponible sur cette période.</div>
            ) : (
              <div className="wp-training-stats-table-wrap">
                <table className="wp-training-stats-table">
                  <thead>
                    <tr>
                      <th>Cycle</th>
                      <th>Période</th>
                      <th>Réussite</th>
                      <th>Progression</th>
                      <th>Temps</th>
                      <th>Tentatives moy.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycleRows.map((cycle) => (
                      <tr key={cycle.cycle['@id']}>
                        <td>{`Cycle ${cycle.cycle.number}`}</td>
                        <td>{formatCyclePeriod(cycle)}</td>
                        <td>{`${Math.round(cycle.successRate ?? 0)}%`}</td>
                        <td>{`${Math.round(cycle.progressPercent ?? 0)}%`}</td>
                        <td>{formatDuration(cycle.durationMilliseconds ?? 0)}</td>
                        <td>{`${Math.round((cycle.averageAttempts ?? 0) * 10) / 10}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Temps moyen par puzzle sur chaque cycle</h2>
                <p>Évolution du temps moyen pour résoudre un puzzle par cycle.</p>
              </div>
            </div>
            <AverageTimeBarChart emptyMessage="Pas assez de données pour calculer cette moyenne." slots={cycleTimeSlots} />
          </article>
        </section>
      ) : (
        <section className="wp-training-stats-grid wp-training-stats-grid--global">
          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Trainings les plus actifs</h2>
                <p>Les 5 entraînements qui concentrent le plus de temps sur la période.</p>
              </div>
            </div>
            <div className="wp-training-stats-list">
              {mostActiveRows.length === 0 ? <div className="wp-training-stats-empty-block">Aucune activité sur cette période.</div> : mostActiveRows.map(({ stats, summary: row }) => (
                <button className="wp-training-stats-list__row is-button" key={row.training['@id']} type="button" onClick={() => onOpenTraining(row.training['@id'], 'detail')}>
                  <div className="wp-training-stats-list__main">
                    <TrainingCell training={row.training} />
                    <small>{formatDuration(stats.durationMilliseconds)}</small>
                  </div>
                  <div className="wp-training-stats-list__meta">
                    <strong>{`${stats.successRate}%`}</strong>
                    <span>{`${stats.progressPercent}%`}</span>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Temps investi / progression obtenue</h2>
                <p>Chaque point représente un entraînement sur la période choisie.</p>
              </div>
            </div>
            <ScatterPlot rows={allRows} />
          </article>

          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Répartition du temps</h2>
                <p>Comparaison du temps passé sur chaque entraînement.</p>
              </div>
            </div>
            <div className="wp-training-stats-bars-list">
              {distributionRows.length === 0 ? <div className="wp-training-stats-empty-block">Aucune répartition à afficher sur cette période.</div> : distributionRows.map(({ stats, summary: row }) => {
                const share = Math.round((stats.durationMilliseconds / distributionTotal) * 100);
                const color = resolveTrainingBranding(row.training).iconBackgroundColor;
                const style = { '--training-share': `${Math.max(6, share)}%`, '--training-share-color': color } as CSSProperties;
                return (
                  <div className="wp-training-stats-bars-list__row" key={row.training['@id']}>
                    <div className="wp-training-stats-bars-list__label"><TrainingCell training={row.training} /></div>
                    <div className="wp-training-stats-bars-list__track"><span style={style} /></div>
                    <strong>{`${share}%`}</strong>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="wp-training-stats-panel">
            <div className="wp-training-stats-panel__head">
              <div>
                <h2>Trainings les plus réguliers</h2>
                <p>Ceux que vous travaillez le plus souvent sur la période choisie.</p>
              </div>
            </div>
            <div className="wp-training-stats-list">
              {regularRows.length === 0 ? <div className="wp-training-stats-empty-block">Aucune régularité exploitable sur cette période.</div> : regularRows.map(({ stats, summary: row }) => {
                const width = `${Math.max(8, (stats.activeDays / Math.max(effectiveDays, 1)) * 100)}%`;
                return (
                  <div className="wp-training-stats-list__row" key={row.training['@id']}>
                    <div className="wp-training-stats-list__main">
                      <TrainingCell training={row.training} />
                      <small>{`${stats.activeDays} jour${stats.activeDays > 1 ? 's' : ''} actif${stats.activeDays > 1 ? 's' : ''}`}</small>
                    </div>
                    <div className="wp-training-stats-regularity"><span style={{ width }} /></div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

export type { TrainingsStatsViewProps };
export default TrainingsStatsView;


