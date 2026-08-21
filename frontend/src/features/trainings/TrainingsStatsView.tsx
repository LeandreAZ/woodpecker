import { useMemo, useState, type ReactElement } from 'react';
import * as AppIcons from '../../shared/AppIcons';
import { TrainingLogoBadge } from './TrainingBranding';
import { formatDuration } from './trainingsUtils';
import type {
  DailyActivityPoint,
  StatsOverview,
  TrainingCycleSummary,
  TrainingDashboardSummary,
  TrainingSummary,
  View,
} from './trainingsTypes';

type StatsMetricKey = 'averageAttempts' | 'progressPercent' | 'successRate';

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

type WindowActivitySummary = {
  activeDays: number;
  attemptCount: number;
  averageAttempts: number;
  durationMilliseconds: number;
  handledPuzzleCount: number;
  progressPercent: number;
  successfulAttemptCount: number;
  successRate: number;
};

type ChartPoint = {
  label: string;
  value: number;
};

type StackedPoint = {
  label: string;
  primary: number;
  secondary: number;
};

type CardDefinition = {
  deltaLabel: string;
  deltaTone: 'is-negative' | 'is-neutral' | 'is-positive';
  icon: ReactElement;
  label: string;
  value: string;
};

const PERIOD_OPTIONS = [7, 14, 30, 60, 90] as const;
const CYCLE_METRICS: Array<{ key: StatsMetricKey; label: string; unit: 'count' | 'percent' }> = [
  { key: 'successRate', label: 'Taux de réussite', unit: 'percent' },
  { key: 'progressPercent', label: 'Progression globale', unit: 'percent' },
  { key: 'averageAttempts', label: 'Tentatives moyennes', unit: 'count' },
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

function formatDayLabel(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
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

function formatDelta(value: number, unit: 'count' | 'duration' | 'percent') {
  const rounded = unit === 'count' ? Math.round(value * 10) / 10 : Math.round(value);
  if (rounded === 0) {
    return 'Stable sur la période précédente';
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
  if (value > 0) {
    return 'is-positive';
  }
  if (value < 0) {
    return 'is-negative';
  }
  return 'is-neutral';
}

function sumDuration(points: DailyActivityPoint[]) {
  return points.reduce((total, point) => total + (point.durationMilliseconds ?? 0), 0);
}

function sumAttempts(points: DailyActivityPoint[]) {
  return points.reduce((total, point) => total + (point.attemptCount ?? 0), 0);
}

function sumSuccessful(points: DailyActivityPoint[]) {
  return points.reduce((total, point) => total + (point.successfulAttemptCount ?? 0), 0);
}

function sumHandled(points: DailyActivityPoint[]) {
  return points.reduce((total, point) => total + (point.handledPuzzleCount ?? 0), 0);
}

function buildWindowSummary(points: DailyActivityPoint[], puzzleCount: number): WindowActivitySummary {
  const attemptCount = sumAttempts(points);
  const successfulAttemptCount = sumSuccessful(points);
  const handledPuzzleCount = sumHandled(points);
  const durationMilliseconds = sumDuration(points);
  const progressPercent = puzzleCount > 0 ? clampPercent((handledPuzzleCount / puzzleCount) * 100) : 0;
  const averageAttempts = handledPuzzleCount > 0 ? Math.round((attemptCount / handledPuzzleCount) * 10) / 10 : 0;
  const successRate = attemptCount > 0 ? clampPercent((successfulAttemptCount / attemptCount) * 100) : 0;
  const activeDays = points.filter((point) => (point.attemptCount ?? 0) > 0 || (point.durationMilliseconds ?? 0) > 0).length;

  return {
    activeDays,
    attemptCount,
    averageAttempts,
    durationMilliseconds,
    handledPuzzleCount,
    progressPercent,
    successfulAttemptCount,
    successRate,
  };
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

function buildCard(label: string, value: string, deltaValue: number, deltaUnit: 'count' | 'duration' | 'percent', icon: ReactElement): CardDefinition {
  return {
    deltaLabel: formatDelta(deltaValue, deltaUnit),
    deltaTone: getDeltaTone(deltaValue),
    icon,
    label,
    value,
  };
}

function buildChartPath(points: ChartPoint[], width: number, height: number) {
  if (points.length === 0) {
    return '';
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  const stepX = points.length === 1 ? 0 : width / (points.length - 1);

  return points
    .map((point, index) => {
      const x = stepX * index;
      const y = height - (point.value / max) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildCycleChartPoints(cycles: TrainingCycleSummary[], metric: StatsMetricKey) {
  const visibleCycles = [...cycles].reverse();
  return visibleCycles.map((cycle) => ({
    label: `Cycle ${cycle.cycle.number}`,
    value:
      metric === 'averageAttempts'
        ? cycle.averageAttempts ?? 0
        : metric === 'successRate'
          ? cycle.successRate ?? 0
          : cycle.progressPercent ?? 0,
  }));
}

function buildAverageTimePoints(cycles: TrainingCycleSummary[]) {
  const visibleCycles = [...cycles].reverse();
  return visibleCycles.map((cycle) => {
    const handled = Math.max(cycle.solved + cycle.failed, 1);
    const durationPerPuzzle = (cycle.durationMilliseconds ?? 0) / handled;
    return {
      label: `Cycle ${cycle.cycle.number}`,
      value: Math.round(durationPerPuzzle / 1000),
    };
  });
}

function buildResolutionFlowPoints(cycles: TrainingCycleSummary[]) {
  const visibleCycles = [...cycles].reverse();
  return visibleCycles.map((cycle) => ({
    label: `Cycle ${cycle.cycle.number}`,
    primary: cycle.solved,
    secondary: cycle.failed,
  }));
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
    const minutesPerPoint = stats.progressPercent > 0
      ? Math.round((stats.durationMilliseconds / 60000 / stats.progressPercent) * 10) / 10
      : 0;

    return {
      minutesPerPoint,
      progressPerHour,
      stats,
      summary,
    };
  });
}

function formatMinutesPerPoint(value: number) {
  if (!value || !Number.isFinite(value)) {
    return '—';
  }

  return `${value.toFixed(1)} min / 1%`;
}

function formatProgressRate(value: number) {
  if (!value || !Number.isFinite(value)) {
    return '0% / h';
  }

  return `${value.toFixed(1)}% / h`;
}

function StatsLineChart({ accentClassName, points, unit }: { accentClassName: string; points: ChartPoint[]; unit: 'count' | 'percent' }) {
  const width = 640;
  const height = 220;
  const path = buildChartPath(points, width, height);
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="wp-stats-v2-chart">
      <div className="wp-stats-v2-chart__main">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Évolution graphique">
          {[0, 0.25, 0.5, 0.75, 1].map((step) => (
            <line
              key={step}
              className="wp-stats-v2-chart__grid"
              x1="0"
              x2={String(width)}
              y1={String(height - height * step)}
              y2={String(height - height * step)}
            />
          ))}
          {path ? <path className={`wp-stats-v2-chart__line ${accentClassName}`} d={path} /> : null}
          {points.map((point, index) => {
            const x = points.length === 1 ? width / 2 : (width / Math.max(points.length - 1, 1)) * index;
            const y = height - (point.value / max) * height;
            return <circle key={`${point.label}-${index}`} className={`wp-stats-v2-chart__dot ${accentClassName}`} cx={x} cy={y} r="4" />;
          })}
        </svg>
      </div>
      <div className="wp-stats-v2-chart__labels">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
      <div className="wp-stats-v2-chart__meta">
        <span>{unit === 'percent' ? '0%' : '0'}</span>
        <span>{unit === 'percent' ? `${Math.round(max)}%` : `${Math.round(max * 10) / 10}`}</span>
      </div>
    </div>
  );
}

function StatsStackedChart({ points }: { points: StackedPoint[] }) {
  const max = Math.max(...points.map((point) => point.primary + point.secondary), 1);

  return (
    <div className="wp-stats-v2-stack-chart">
      {points.map((point) => {
        const primaryWidth = `${Math.max(8, (point.primary / max) * 100)}%`;
        const secondaryWidth = point.secondary > 0 ? `${Math.max(6, (point.secondary / max) * 100)}%` : '0%';
        return (
          <div className="wp-stats-v2-stack-chart__row" key={point.label}>
            <div className="wp-stats-v2-stack-chart__label">
              <strong>{point.label}</strong>
              <small>{`${point.primary} résolus · ${point.secondary} à revoir`}</small>
            </div>
            <div className="wp-stats-v2-stack-chart__bars">
              <span className="is-primary" style={{ width: primaryWidth }} />
              {point.secondary > 0 ? <span className="is-secondary" style={{ width: secondaryWidth }} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrainingCell({ training }: { training: TrainingDashboardSummary['training'] }) {
  return (
    <span className="wp-stats-v2-training-cell">
      <TrainingLogoBadge size="sm" training={training} />
      <strong>{training.name}</strong>
    </span>
  );
}

function TrainingsStatsView({
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

  const activeTrainings = useMemo(
    () =>
      trainingBreakdown.map((item) => {
        const currentPoints = buildRange(item.dailyActivity ?? [], windowStartDate, endDate);
        const previousPoints = buildRange(item.dailyActivity ?? [], previousStartDate, previousEndDate);
        return {
          current: buildWindowSummary(currentPoints, item.puzzleCount ?? 0),
          previous: buildWindowSummary(previousPoints, item.puzzleCount ?? 0),
          summary: item,
        };
      }),
    [endDate, previousEndDate, previousStartDate, trainingBreakdown, windowStartDate],
  );

  const allModeCards = useMemo(() => {
    if (activeTrainings.length === 0) {
      return [] as CardDefinition[];
    }

    const averagePair = (extractor: (item: (typeof activeTrainings)[number]) => number) => ({
      current: activeTrainings.reduce((total, item) => total + extractor(item), 0) / activeTrainings.length,
      previous: activeTrainings.reduce((total, item) => total + extractor({ ...item, current: item.previous, previous: item.previous }), 0) / activeTrainings.length,
    });

    const success = averagePair((item) => item.current.successRate);
    const progress = averagePair((item) => item.current.progressPercent);
    const duration = averagePair((item) => item.current.durationMilliseconds);
    const attempts = averagePair((item) => item.current.averageAttempts);

    return [
      buildCard('Taux de réussite', `${Math.round(success.current)}%`, success.current - success.previous, 'percent', iconElement(<AppIcons.TargetIcon width={20} height={20} />)),
      buildCard('Progression globale', `${Math.round(progress.current)}%`, progress.current - progress.previous, 'percent', iconElement(<AppIcons.TrendUpIcon width={20} height={20} />)),
      buildCard("Temps d'entraînement", formatDuration(duration.current), duration.current - duration.previous, 'duration', iconElement(<AppIcons.HistoryIcon width={20} height={20} />)),
      buildCard('Tentatives moyennes', `${Math.round(attempts.current * 10) / 10}`, attempts.current - attempts.previous, 'count', iconElement(<AppIcons.RepeatIcon width={20} height={20} />)),
    ];
  }, [activeTrainings]);

  const selectedCurrent = selectedSummary
    ? buildWindowSummary(buildRange(summary?.dailyActivity ?? [], windowStartDate, endDate), summary?.puzzleCount ?? selectedSummary.puzzleCount ?? 0)
    : null;
  const selectedPrevious = selectedSummary
    ? buildWindowSummary(buildRange(summary?.dailyActivity ?? [], previousStartDate, previousEndDate), summary?.puzzleCount ?? selectedSummary.puzzleCount ?? 0)
    : null;

  const selectedModeCards =
    selectedSummary && selectedCurrent && selectedPrevious
      ? [
          buildCard('Taux de réussite', `${Math.round(selectedCurrent.successRate)}%`, selectedCurrent.successRate - selectedPrevious.successRate, 'percent', iconElement(<AppIcons.TargetIcon width={20} height={20} />)),
          buildCard('Progression globale', `${Math.round(selectedCurrent.progressPercent)}%`, selectedCurrent.progressPercent - selectedPrevious.progressPercent, 'percent', iconElement(<AppIcons.TrendUpIcon width={20} height={20} />)),
          buildCard("Temps d'entraînement", formatDuration(selectedCurrent.durationMilliseconds), selectedCurrent.durationMilliseconds - selectedPrevious.durationMilliseconds, 'duration', iconElement(<AppIcons.HistoryIcon width={20} height={20} />)),
          buildCard('Tentatives moyennes', `${Math.round(selectedCurrent.averageAttempts * 10) / 10}`, selectedCurrent.averageAttempts - selectedPrevious.averageAttempts, 'count', iconElement(<AppIcons.RepeatIcon width={20} height={20} />)),
        ]
      : [];

  const cycleRows = useMemo(() => {
    const source = summary?.cycleSummaries ?? [];
    const filtered = source.filter((item) => {
      const startedAt = item.cycle.startedAt ?? item.cycle.completedAt;
      if (!startedAt) {
        return false;
      }

      const startedAtDate = new Date(startedAt);
      return !Number.isNaN(startedAtDate.getTime()) && startedAtDate >= windowStartDate;
    });

    return (filtered.length > 0 ? filtered : source).slice(0, 5);
  }, [summary?.cycleSummaries, windowStartDate]);

  const cycleTrendPoints = useMemo(() => buildCycleChartPoints(cycleRows, selectedMetric), [cycleRows, selectedMetric]);
  const averageTimePoints = useMemo(() => buildAverageTimePoints(cycleRows), [cycleRows]);
  const resolutionFlowPoints = useMemo(() => buildResolutionFlowPoints(cycleRows), [cycleRows]);
  const globalRows = useMemo(() => buildAllTrainingsActivityRows(trainingBreakdown, effectiveDays), [effectiveDays, trainingBreakdown]);
  const topActiveTrainings = [...globalRows]
    .sort((left, right) => right.stats.durationMilliseconds - left.stats.durationMilliseconds)
    .slice(0, 5);
  const topRegularTrainings = [...globalRows]
    .sort((left, right) => right.stats.activeDays - left.stats.activeDays || right.stats.handledPuzzleCount - left.stats.handledPuzzleCount)
    .slice(0, 5);
  const timeVsProgressRows = [...globalRows]
    .filter((item) => item.stats.durationMilliseconds > 0 || item.stats.progressPercent > 0)
    .sort((left, right) => right.progressPerHour - left.progressPerHour)
    .slice(0, 5);
  const themeShareTotal = Math.max(globalRows.reduce((total, item) => total + item.stats.durationMilliseconds, 0), 1);
  const themeDistributionRows = [...globalRows]
    .filter((item) => item.stats.durationMilliseconds > 0)
    .sort((left, right) => right.stats.durationMilliseconds - left.stats.durationMilliseconds)
    .slice(0, 5)
    .map((item) => ({
      share: Math.round((item.stats.durationMilliseconds / themeShareTotal) * 100),
      ...item,
    }));
  const activeMetric = CYCLE_METRICS.find((metric) => metric.key === selectedMetric) ?? CYCLE_METRICS[0];

  return (
    <div className="wp-page wp-stats-v2-page">
      <header className="wp-stats-v2-header">
        <div>
          <h1>{selectedSummary ? `Statistiques · ${selectedSummary.training.name}` : 'Statistiques globales'}</h1>
          <p>Des repères concrets pour voir ce qui progresse, ce qui coûte du temps et ce qu il faut retravailler.</p>
        </div>
        <div className="wp-stats-v2-header__filters">
          <label className="wp-stats-v2-select">
            <span className="wp-stats-v2-select__icon"><AppIcons.BarsIcon width={18} height={18} /></span>
            <select value={selectedTrainingIri ?? 'all'} onChange={(event) => onSelectTrainingIri(event.target.value === 'all' ? null : event.target.value)}>
              <option value="all">Tous les trainings</option>
              {trainingBreakdown.map((item) => (
                <option key={item.training['@id']} value={item.training['@id']}>
                  {item.training.name}
                </option>
              ))}
            </select>
          </label>

          <label className="wp-stats-v2-select">
            <span className="wp-stats-v2-select__icon"><AppIcons.HistoryIcon width={18} height={18} /></span>
            <select value={String(selectedDays)} onChange={(event) => setSelectedDays(Number(event.target.value) as (typeof PERIOD_OPTIONS)[number])}>
              {PERIOD_OPTIONS.map((option) => (
                <option key={option} value={option}>{option} jours</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {isLoading ? <p className="wp-empty">Chargement des statistiques...</p> : null}
      {isError && errorMessage ? <p className="wp-empty">{errorMessage}</p> : null}
      {selectedSummary && summaryIsError && summaryError ? <p className="wp-empty">{summaryError}</p> : null}
      {selectedSummary && summaryIsLoading ? <p className="wp-empty">Chargement du détail de l'entraînement...</p> : null}

      <p className="wp-stats-v2-period-label">{`${effectiveDays} derniers jours`}</p>

      <section className="wp-stats-v2-cards">
        {(selectedSummary ? selectedModeCards : allModeCards).map((card) => (
          <article className="wp-panel wp-stats-v2-card" key={card.label}>
            <div className="wp-stats-v2-card__top">
              <span className="wp-stats-v2-card__icon">{card.icon}</span>
              <span>{card.label}</span>
            </div>
            <strong>{card.value}</strong>
            <small className={card.deltaTone}>{card.deltaLabel}</small>
          </article>
        ))}
      </section>

      {selectedSummary ? (
        <section className="wp-stats-v2-grid wp-stats-v2-grid--quad">
          <article className="wp-panel wp-stats-v2-panel">
            <div className="wp-stats-v2-panel__head">
              <div>
                <h2>Évolution des cycles</h2>
                <p>{`${effectiveDays} derniers jours`}</p>
              </div>
              <label className="wp-stats-v2-select wp-stats-v2-select--compact">
                <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as StatsMetricKey)}>
                  {CYCLE_METRICS.map((metric) => (
                    <option key={metric.key} value={metric.key}>{metric.label}</option>
                  ))}
                </select>
              </label>
            </div>
            {cycleTrendPoints.length > 0 ? (
              <StatsLineChart accentClassName="is-lime" points={cycleTrendPoints} unit={activeMetric.unit} />
            ) : (
              <p className="wp-empty">Aucun cycle disponible sur cette période.</p>
            )}
          </article>

          <article className="wp-panel wp-stats-v2-panel">
            <div className="wp-stats-v2-panel__head">
              <div>
                <h2>Détail des cycles</h2>
                <p>Vue synthétique des cinq cycles les plus parlants.</p>
              </div>
            </div>
            <div className="wp-stats-v2-table wp-stats-v2-table--cycles">
              <div className="wp-stats-v2-table__head">
                <span>Cycle</span>
                <span>Période</span>
                <span>Réussite</span>
                <span>Progression</span>
                <span>Tentatives moy.</span>
                <span>Durée</span>
              </div>
              {cycleRows.map((cycle) => (
                <div className="wp-stats-v2-table__row" key={cycle.cycle['@id']}>
                  <span>{`Cycle ${cycle.cycle.number}`}</span>
                  <span>{`${formatCompactDate(cycle.cycle.startedAt)}${cycle.cycle.completedAt ? ` - ${formatCompactDate(cycle.cycle.completedAt)}` : ''}`}</span>
                  <span className="is-lime">{`${Math.round(cycle.successRate ?? 0)}%`}</span>
                  <span>{`${Math.round(cycle.progressPercent ?? 0)}%`}</span>
                  <span>{`${Math.round((cycle.averageAttempts ?? 0) * 10) / 10}`}</span>
                  <span>{formatDuration(cycle.durationMilliseconds ?? 0)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="wp-panel wp-stats-v2-panel">
            <div className="wp-stats-v2-panel__head">
              <div>
                <h2>Temps moyen par puzzle</h2>
                <p>Temps réellement investi sur chaque cycle.</p>
              </div>
            </div>
            {averageTimePoints.length > 0 ? (
              <StatsLineChart accentClassName="is-blue" points={averageTimePoints} unit="count" />
            ) : (
              <p className="wp-empty">Pas assez de données pour calculer cette moyenne.</p>
            )}
          </article>

          <article className="wp-panel wp-stats-v2-panel">
            <div className="wp-stats-v2-panel__head">
              <div>
                <h2>À revoir vers résolu</h2>
                <p>Équilibre entre puzzles verrouillés et puzzles convertis.</p>
              </div>
            </div>
            {resolutionFlowPoints.length > 0 ? (
              <StatsStackedChart points={resolutionFlowPoints} />
            ) : (
              <p className="wp-empty">Aucun flux de résolution disponible pour le moment.</p>
            )}
          </article>
        </section>
      ) : (
        <section className="wp-stats-v2-grid wp-stats-v2-grid--quad">
          <article className="wp-panel wp-stats-v2-panel">
            <div className="wp-stats-v2-panel__head with-link">
              <div>
                <h2>Trainings les plus actifs</h2>
                <p>Les cinq entraînements qui concentrent le plus de temps.</p>
              </div>
              <button className="wp-link-button" type="button">Voir tout</button>
            </div>
            <div className="wp-stats-v2-table wp-stats-v2-table--trainings">
              <div className="wp-stats-v2-table__head">
                <span>Entraînement</span>
                <span>Temps</span>
                <span>Réussite</span>
                <span>Progression</span>
              </div>
              {topActiveTrainings.map(({ stats, summary }) => (
                <button className="wp-stats-v2-table__row wp-stats-v2-table__row--button" key={summary.training['@id']} type="button" onClick={() => onOpenTraining(summary.training['@id'], 'detail')}>
                  <TrainingCell training={summary.training} />
                  <span>{formatDuration(stats.durationMilliseconds)}</span>
                  <span className="is-lime">{`${stats.successRate}%`}</span>
                  <span>{`${stats.progressPercent}%`}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="wp-panel wp-stats-v2-panel">
            <div className="wp-stats-v2-panel__head">
              <div>
                <h2>Temps investi / progression obtenue</h2>
                <p>Quels trainings transforment le mieux votre temps en progression.</p>
              </div>
            </div>
            <div className="wp-stats-v2-list">
              {timeVsProgressRows.map(({ minutesPerPoint, progressPerHour, stats, summary }) => (
                <div className="wp-stats-v2-list__row" key={summary.training['@id']}>
                  <div className="wp-stats-v2-list__main">
                    <TrainingCell training={summary.training} />
                    <small>{`${formatDuration(stats.durationMilliseconds)} investis pour ${stats.progressPercent}% de progression`}</small>
                  </div>
                  <div className="wp-stats-v2-list__meta">
                    <strong>{formatProgressRate(progressPerHour)}</strong>
                    <span>{formatMinutesPerPoint(minutesPerPoint)}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="wp-panel wp-stats-v2-panel">
            <div className="wp-stats-v2-panel__head">
              <div>
                <h2>Répartition du temps par thème</h2>
                <p>Lecture par entraînement, comme repère de vos thèmes du moment.</p>
              </div>
            </div>
            <div className="wp-stats-v2-share-list">
              {themeDistributionRows.map(({ share, stats, summary }) => (
                <div className="wp-stats-v2-share-list__row" key={summary.training['@id']}>
                  <div className="wp-stats-v2-share-list__label">
                    <TrainingCell training={summary.training} />
                    <small>{formatDuration(stats.durationMilliseconds)}</small>
                  </div>
                  <div className="wp-stats-v2-share-list__bar">
                    <span style={{ width: `${Math.max(10, share)}%` }} />
                  </div>
                  <strong>{`${share}%`}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="wp-panel wp-stats-v2-panel">
            <div className="wp-stats-v2-panel__head">
              <div>
                <h2>Trainings les plus réguliers</h2>
                <p>Ceux que vous travaillez le plus souvent sur la période choisie.</p>
              </div>
            </div>
            <div className="wp-stats-v2-list">
              {topRegularTrainings.map(({ stats, summary }) => (
                <div className="wp-stats-v2-list__row" key={summary.training['@id']}>
                  <div className="wp-stats-v2-list__main">
                    <TrainingCell training={summary.training} />
                    <small>{`${stats.activeDays} jour${stats.activeDays > 1 ? 's' : ''} actif${stats.activeDays > 1 ? 's' : ''}`}</small>
                  </div>
                  <div className="wp-stats-v2-list__meta">
                    <strong>{formatDuration(stats.durationMilliseconds)}</strong>
                    <span>{`${stats.handledPuzzleCount} puzzles traités`}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

export type { TrainingsStatsViewProps };
export { TrainingsStatsView };
export default TrainingsStatsView;

