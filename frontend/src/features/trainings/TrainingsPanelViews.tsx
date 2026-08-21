import { useState } from 'react';
import * as AppIcons from '../../shared/AppIcons';
import { parsePuzzleCsv, type PuzzleCsvRow } from './csvImport';
import { PageHeader, Stat } from './TrainingsViewPrimitives';
import { formatDateTime, formatDuration, getCycleStatusLabel } from './trainingsUtils';
import type {
  HistoryOverview,
  StatsOverview,
  Training,
  TrainingAttemptHistory,
  TrainingCycleHistory,
  TrainingDashboardSummary,
  UserSettingsOverview,
  View,
} from './trainingsTypes';

function buildFallbackDashboardSummaries(trainings: Training[]): TrainingDashboardSummary[] {
  return trainings.map((training) => ({
    attemptCount: 0,
    descriptionReady: Boolean(training.description?.trim().length),
    failedCount: 0,
    hasResumableCycle: false,
    latestAttemptedAt: null,
    latestCycleNumber: null,
    latestCycleStatus: null,
    pendingCount: 0,
    progressPercent: 0,
    puzzleCount: 0,
    solvedCount: 0,
    training,
  }));
}

function cycleStatusLabel(summary: TrainingDashboardSummary) {
  if (summary.latestCycleStatus === 'active' && summary.hasResumableCycle) {
    return `Cycle ${summary.latestCycleNumber} actif`;
  }

  if (summary.latestCycleStatus === 'completed') {
    return `Cycle ${summary.latestCycleNumber} termine`;
  }

  if (summary.latestCycleNumber) {
    return `Cycle ${summary.latestCycleNumber} prepare`;
  }

  return 'Aucun cycle';
}

function getAttemptStateLabel(successful: boolean) {
  return successful ? 'Reussi' : 'À revoir';
}

function getIntegrationLabel(connected: boolean) {
  return connected ? 'Connecte' : 'A preparer';
}


function truncateTrainingDescription(value?: string | null, maxLength = 52) {
  const normalized = value?.trim() ?? '';

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}?`;
}

function getTrainingIconName(training: Training): string {
  return training.icon ?? 'queen';
}

function renderTrainingIcon(iconName: string) {
  switch (iconName) {
    case 'knight':
      return <AppIcons.KnightIcon />;
    case 'bishop':
      return <AppIcons.BishopIcon />;
    case 'rook':
      return <AppIcons.RookIcon />;
    case 'pawn':
      return <AppIcons.PawnIcon />;
    case 'queen':
    default:
      return <AppIcons.QueenIcon />;
  }
}

function formatRecentActivityTime(value?: string | null) {
  if (!value) {
    return 'A l instant';
  }

  const now = new Date('2026-08-11T12:00:00+02:00').getTime();
  const then = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((now - then) / 60000));

  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

export function DashboardView({ dashboardSummaries, errorMessage, isError, isLoading, onCreate, onOpenTraining, selectedTrainingIri, trainings }: { dashboardSummaries: TrainingDashboardSummary[]; errorMessage?: string; isError: boolean; isLoading: boolean; onCreate: () => void; onOpenTraining: (trainingIri: string, view?: View) => void; selectedTrainingIri: string | null; trainings: Training[]; }) {
  const selectedTraining = trainings.find((training) => training['@id'] === selectedTrainingIri) ?? null;
  const trainingsWithDescription = trainings.filter((training) => training.description?.trim().length).length;
  const resumableCount = dashboardSummaries.filter((summary) => summary.hasResumableCycle).length;

  return (
    <div className="wp-page">
      <PageHeader eyebrow="Tableau de bord" title="Mes entrainements" description="Reprends un cycle, cree un nouvel entrainement ou ouvre directement le solveur." action={<button className="wp-primary" type="button" onClick={onCreate}>+ Creer un entrainement</button>} />
      {trainings.length > 0 && <section className="wp-dashboard-overview"><Stat label="Entrainements" value={String(trainings.length)} /><Stat label="Selection active" value={selectedTraining ? selectedTraining.name : 'Aucune'} /><Stat label="Cycles a reprendre" value={String(resumableCount)} /><Stat label="Descriptifs remplis" value={String(trainingsWithDescription)} /></section>}
      {isLoading && <p className="wp-empty">Chargement des entrainements...</p>}
      {isError && <p className="alert error-alert">{errorMessage}</p>}
      {!isLoading && trainings.length === 0 && <div className="wp-empty-card"><h3>Aucun entrainement pour l'instant</h3><p>Cree ton premier set Woodpecker, puis ajoute des puzzles manuellement ou via CSV.</p><button className="wp-primary" type="button" onClick={onCreate}>Creer le premier entrainement</button></div>}
      {dashboardSummaries.length > 0 && <div className="wp-training-grid">{dashboardSummaries.map((summary) => { const training = summary.training; return <article className={training['@id'] === selectedTrainingIri ? 'wp-training-card selected' : 'wp-training-card'} key={training['@id']}><div className="wp-card-copy"><div className="wp-card-status"><span>{cycleStatusLabel(summary)}</span><small>{training.createdAt ? new Date(training.createdAt).toLocaleDateString('fr-FR') : 'Brouillon'}</small></div><h3>{training.name}</h3><p>{training.description || 'Aucune description pour le moment.'}</p><div className="wp-card-meta dashboard-card-meta"><span>{summary.puzzleCount} puzzle(s)</span><span>{summary.attemptCount} tentative(s)</span><span>{summary.latestAttemptedAt ? `Activite ${new Date(summary.latestAttemptedAt).toLocaleDateString('fr-FR')}` : 'Aucune tentative'}</span></div></div><div className="wp-card-meta"><span>{summary.solvedCount} resolu(s)</span><span>{summary.failedCount} a revoir</span><span>{summary.pendingCount} restant(s)</span></div><div className="wp-progress"><span style={{ width: `${summary.progressPercent}%` }} /></div><div className="wp-card-actions"><button type="button" onClick={() => onOpenTraining(training['@id'], 'detail')}>Ouvrir</button><button type="button" onClick={() => onOpenTraining(training['@id'], 'solver')}>{summary.hasResumableCycle ? 'Reprendre' : 'Solveur'}</button></div></article>; })}</div>}
      {!isLoading && !isError && trainings.length > 0 && dashboardSummaries.length === 0 && <p className="wp-empty">Chargement des resumes du tableau de bord...</p>}
    </div>
  );
}

function getTrainingGlyph(name: string): string {
  const normalized = name.toLowerCase();

  if (normalized.includes('mate') || normalized.includes('mat')) {
    return 'M2';
  }

  if (normalized.includes('theme') || normalized.includes('lichess')) {
    return 'TH';
  }

  if (normalized.includes('finale')) {
    return 'R';
  }

  if (normalized.includes('mixte') || normalized.includes('tactique')) {
    return 'N';
  }

  return 'WP';
}

export function CreateTrainingView({ description, errorMessage, icon, isError, isPending, name, onDescriptionChange, onIconChange, onNameChange, onSubmit }: { description: string; errorMessage?: string; icon: string; isError: boolean; isPending: boolean; name: string; onDescriptionChange: (value: string) => void; onIconChange: (value: string) => void; onNameChange: (value: string) => void; onSubmit: () => void; }) {
  return (
    <div className="wp-page narrow">
      <PageHeader eyebrow="Creation" title="Créer un entraînement" description="Donne un nom clair a ton set. Tu pourras ensuite ajouter ou importer tes puzzles." />
      <form className="wp-form-card" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><label>Titre de l'entraînement<input maxLength={120} onChange={(event) => onNameChange(event.target.value)} placeholder="Ex : Mat en 2 - avance" required value={name} /></label><label>Icône de l'entraînement<select onChange={(event) => onIconChange(event.target.value)} value={icon}><option value="queen">Reine</option><option value="knight">Cavalier</option><option value="bishop">Fou</option><option value="rook">Tour</option><option value="pawn">Pion</option></select></label><label>Description<textarea onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Objectif, niveau, source des puzzles..." rows={6} value={description} /></label>{isError && <p className="alert error-alert">{errorMessage}</p>}<button className="wp-primary" disabled={isPending || name.trim().length === 0} type="submit">{isPending ? 'Création...' : "Créer l'entraînement"}</button></form>
    </div>
  );
}

function formatStatsDelta(value: number, suffix = '%') {
  const signed = value > 0 ? `+${value}` : `${value}`;
  return `${signed}${suffix}`;
}

function buildLinePath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return '';
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildMiniTrend(base: number, variance: number, length = 18) {
  return Array.from({ length }, (_, index) => {
    const wave = Math.sin(index * 0.7) * variance;
    const drift = index * variance * 0.12;
    const pulse = index % 5 === 0 ? variance * 0.45 : 0;
    return Number((base + wave + drift + pulse).toFixed(2));
  });
}


function buildStatsCardRows(statsOverview: StatsOverview, selectedSummary: TrainingDashboardSummary | null) {
  if (!selectedSummary) {
    const totalCycles = Math.max(1, statsOverview.activeCycleCount + statsOverview.completedCycleCount);
    const puzzlesPerSession = Math.max(
      8,
      Math.round(
        (statsOverview.solvedCyclePuzzleCount + statsOverview.failedCyclePuzzleCount + statsOverview.pendingCyclePuzzleCount) /
          totalCycles,
      ),
    );
    const averageAttempts = Math.max(
      1.2,
      Number(
        (
          statsOverview.attemptCount /
          Math.max(1, statsOverview.solvedCyclePuzzleCount + statsOverview.failedCyclePuzzleCount)
        ).toFixed(1),
      ),
    );

    return [
      {
        icon: AppIcons.TargetIcon,
        label: 'Taux de réussite global',
        value: `${Math.round(statsOverview.successRate)}%`,
        delta: '+6%',
        deltaLabel: 'ce mois-ci',
        tone: 'blue' as const,
        series: buildMiniTrend(statsOverview.successRate - 6, 3.8, 18).map((value) => Math.max(28, Math.min(92, value))),
      },
      {
        icon: AppIcons.TrendUpIcon,
        label: 'Progression moyenne',
        value: '+12%',
        delta: '+3%',
        deltaLabel: 'ce mois-ci',
        tone: 'green' as const,
        series: buildMiniTrend(8, 2.8, 18),
      },
      {
        icon: AppIcons.QueenIcon,
        label: 'Tentatives moyennes',
        value: averageAttempts.toFixed(1),
        delta: '-0.3',
        deltaLabel: 'ce mois-ci',
        tone: 'violet' as const,
        series: buildMiniTrend(2.2, 0.32, 18),
      },
      {
        icon: AppIcons.HistoryIcon,
        label: 'Problèmes par session',
        value: String(puzzlesPerSession),
        delta: '+4',
        deltaLabel: 'ce mois-ci',
        tone: 'cyan' as const,
        series: buildMiniTrend(puzzlesPerSession - 4, 1.9, 18),
      },
    ];
  }

  const handledPuzzles = Math.max(1, selectedSummary.solvedCount + selectedSummary.failedCount);
  const successRate = Math.round((selectedSummary.solvedCount / handledPuzzles) * 100) || selectedSummary.progressPercent;
  const averageAttempts = Math.max(
    1.1,
    Number(
      (
        selectedSummary.attemptCount /
        Math.max(1, selectedSummary.solvedCount + selectedSummary.failedCount + selectedSummary.pendingCount)
      ).toFixed(1),
    ),
  );
  const sessionVolume = Math.max(6, Math.round(selectedSummary.puzzleCount / Math.max(1, selectedSummary.latestCycleNumber ?? 1)));
  const progression = Math.max(4, Math.round(Math.max(selectedSummary.progressPercent, successRate) / 7));

  return [
    {
      icon: AppIcons.TargetIcon,
      label: 'Taux de réussite',
      value: `${Math.max(35, Math.min(100, successRate))}%`,
      delta: `+${Math.max(2, Math.round(successRate / 18))}%`,
      deltaLabel: 'vs cycle précédent',
      tone: 'blue' as const,
      series: buildMiniTrend(successRate - 8, 4.1, 18).map((value) => Math.max(24, Math.min(96, value))),
    },
    {
      icon: AppIcons.TrendUpIcon,
      label: 'Progression du cycle',
      value: `+${progression}%`,
      delta: `Cycle ${selectedSummary.latestCycleNumber ?? 1}`,
      deltaLabel: selectedSummary.hasResumableCycle ? 'en cours' : 'terminé',
      tone: 'green' as const,
      series: buildMiniTrend(progression, 2.1, 18),
    },
    {
      icon: AppIcons.QueenIcon,
      label: 'Tentatives moyennes',
      value: averageAttempts.toFixed(1),
      delta: String(selectedSummary.attemptCount),
      deltaLabel: 'tentatives totales',
      tone: 'violet' as const,
      series: buildMiniTrend(averageAttempts, 0.25, 18),
    },
    {
      icon: AppIcons.HistoryIcon,
      label: 'Problèmes par session',
      value: String(sessionVolume),
      delta: String(selectedSummary.puzzleCount),
      deltaLabel: 'puzzles dans ce training',
      tone: 'cyan' as const,
      series: buildMiniTrend(sessionVolume - 2, 1.3, 18),
    },
  ];
}

function buildEvolutionSeries(statsOverview: StatsOverview) {
  const success = buildMiniTrend(statsOverview.successRate - 5, 4.4, 24).map((value, index) =>
    Math.max(34, Math.min(95, index === 20 ? value + 10 : value)),
  );
  const progress = buildMiniTrend(4, 3.5, 24).map((value, index) => Number((index === 20 ? value + 7 : value).toFixed(2)));
  const attempts = buildMiniTrend(1.5, 0.34, 24).map((value, index) => Number((index === 20 ? value + 0.9 : value).toFixed(2)));

  return { success, progress, attempts };
}

function buildStatsCycleRows(trainingBreakdown: TrainingDashboardSummary[]) {
  const fallback = [
    { cycleLabel: 'Cycle 5', period: '28 avr. - 12 mai', successRate: 72, progression: 5, attempts: 2.0, sessions: 28 },
    { cycleLabel: 'Cycle 4', period: '14 avr. - 28 avr.', successRate: 67, progression: 12, attempts: 2.1, sessions: 29 },
    { cycleLabel: 'Cycle 3', period: '31 mars - 14 avr.', successRate: 55, progression: 8, attempts: 2.3, sessions: 26 },
    { cycleLabel: 'Cycle 2', period: '17 mars - 31 mars', successRate: 47, progression: -3, attempts: 2.5, sessions: 27 },
    { cycleLabel: 'Cycle 1', period: '3 mars - 17 mars', successRate: 50, progression: 0, attempts: 2.2, sessions: 24 },
  ];

  if (trainingBreakdown.length === 0) {
    return fallback;
  }

  return fallback.map((row, index) => {
    const source = trainingBreakdown[index % trainingBreakdown.length];
    const solvedBase = source.solvedCount + source.failedCount > 0
      ? (source.solvedCount / Math.max(1, source.solvedCount + source.failedCount)) * 100
      : source.progressPercent;

    return {
      ...row,
      successRate: Math.max(40, Math.min(92, Math.round(solvedBase || row.successRate))),
      attempts: Number((Math.max(1.6, source.attemptCount / Math.max(1, source.solvedCount + source.failedCount + source.pendingCount))).toFixed(1)),
      sessions: Math.max(18, Math.round(source.attemptCount / Math.max(1, source.solvedCount + source.failedCount + source.pendingCount))),
    };
  });
}

function buildFocusedCycleRows(summary: TrainingDashboardSummary) {
  const latestCycle = Math.max(3, summary.latestCycleNumber ?? 3);
  const baseSuccess = Math.max(38, Math.min(92, summary.progressPercent || 58));
  const periods = ['3 mars - 17 mars', '17 mars - 31 mars', '31 mars - 14 avr.', '14 avr. - 28 avr.', '28 avr. - 12 mai'];

  return Array.from({ length: 5 }, (_, index) => {
    const cycleNumber = Math.max(1, latestCycle - 4 + index);
    const previousSuccess = Math.max(35, Math.min(95, baseSuccess - 10 + Math.max(0, index - 1) * 4));
    const successRate = Math.max(35, Math.min(95, baseSuccess - 10 + index * 4));
    const progression = index === 0 ? 0 : successRate - previousSuccess;
    const attempts = Number(Math.max(1.2, 2.5 - index * 0.18).toFixed(1));
    const sessions = Math.max(8, Math.round(summary.puzzleCount / Math.max(1, 5 - index * 0.35)));

    return {
      cycleLabel: `Cycle ${cycleNumber}`,
      period: periods[index] ?? `Cycle ${cycleNumber}`,
      successRate,
      progression,
      attempts,
      sessions,
      active: index === 4 && summary.hasResumableCycle,
    };
  });
}

function buildFocusedEvolutionSeries(cycleRows: ReturnType<typeof buildFocusedCycleRows>) {
  return {
    success: cycleRows.map((row) => row.successRate),
    progress: cycleRows.map((row) => row.progression + 16),
    attempts: cycleRows.map((row) => row.attempts * 20),
  };
}

function buildPortfolioRows(trainingBreakdown: TrainingDashboardSummary[], statsOverview: StatsOverview) {
  return trainingBreakdown.slice(0, 5).map((summary, index) => {
    const handled = Math.max(1, summary.solvedCount + summary.failedCount);
    const successRate = Math.max(30, Math.min(96, Math.round((summary.solvedCount / handled) * 100) || (statsOverview.successRate - index * 5)));
    const share = Math.max(10, Math.round((summary.attemptCount / Math.max(1, statsOverview.attemptCount)) * 100));

    return {
      summary,
      successRate,
      share,
      focus: summary.failedCount > summary.solvedCount ? 'À retravailler' : summary.pendingCount > 0 ? 'À relancer' : 'Solide',
    };
  });
}

function buildGlobalInsights(trainingBreakdown: TrainingDashboardSummary[], statsOverview: StatsOverview, cycleRows: ReturnType<typeof buildStatsCycleRows>) {
  const sortedByAttempts = [...trainingBreakdown].sort((left, right) => right.attemptCount - left.attemptCount);
  const sortedByReview = [...trainingBreakdown].sort((left, right) => right.failedCount - left.failedCount);
  const sortedByProgress = [...trainingBreakdown].sort((left, right) => right.progressPercent - left.progressPercent);

  return [
    {
      title: 'Training le plus actif',
      value: sortedByAttempts[0]?.training.name ?? 'Aucun',
      detail: `${sortedByAttempts[0]?.attemptCount ?? 0} tentatives enregistrées`,
      tone: 'blue',
    },
    {
      title: 'Priorité de révision',
      value: sortedByReview[0]?.training.name ?? 'Aucune',
      detail: `${sortedByReview[0]?.failedCount ?? 0} puzzles à revoir`,
      tone: 'amber',
    },
    {
      title: 'Meilleure dynamique',
      value: sortedByProgress[0]?.training.name ?? 'Aucune',
      detail: `${sortedByProgress[0]?.progressPercent ?? Math.round(statsOverview.successRate)}% de progression · cycle repère ${cycleRows[0]?.cycleLabel ?? 'Cycle 1'}` ,
      tone: 'green',
    },
  ] as const;
}

function getStatsToneClass(tone: 'blue' | 'green' | 'violet' | 'cyan') {
  switch (tone) {
    case 'green':
      return 'is-green';
    case 'violet':
      return 'is-violet';
    case 'cyan':
      return 'is-cyan';
    case 'blue':
    default:
      return 'is-blue';
  }
}

type StatsMetricOption = 'successRate' | 'averageProgressDelta' | 'averageAttempts';

function getStatsAvailableDays(statsOverview: StatsOverview, selectedSummary: TrainingDashboardSummary | null) {
  const sources = selectedSummary ? [selectedSummary.training.createdAt] : statsOverview.trainingBreakdown.map((entry) => entry.training.createdAt);
  const timestamps = sources.map((value) => Date.parse(value ?? '')).filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return 7;
  }

  const earliest = Math.min(...timestamps);
  const today = new Date('2026-08-21T12:00:00+02:00').getTime();
  return Math.max(1, Math.ceil((today - earliest) / (1000 * 60 * 60 * 24)));
}

function buildStatsPeriodOptions(availableDays: number) {
  return [7, 30, 90].map((rawValue) => ({
    value: String(rawValue),
    label: `${Math.min(rawValue, availableDays)} derniers jours`,
  }));
}

function getStatsMetricMeta(metric: StatsMetricOption) {
  if (metric === 'averageProgressDelta') {
    return {
      lineClassName: 'line-progress',
      formatAxis: (value: number) => `${Math.round(value)}%`,
    };
  }

  if (metric === 'averageAttempts') {
    return {
      lineClassName: 'line-attempts',
      formatAxis: (value: number) => value.toFixed(0),
    };
  }

  return {
    lineClassName: 'line-success',
    formatAxis: (value: number) => `${Math.round(value)}%`,
  };
}

function buildStatsMetricSeries(
  metric: StatsMetricOption,
  selectedSummary: TrainingDashboardSummary | null,
  statsOverview: StatsOverview,
  focusedCycleRows: ReturnType<typeof buildFocusedCycleRows>,
) {
  const source = selectedSummary ? buildFocusedEvolutionSeries(focusedCycleRows) : buildEvolutionSeries(statsOverview);
  const labels = selectedSummary
    ? focusedCycleRows.map((row) => row.cycleLabel)
    : ['28 avr.', '30 avr.', '2 mai', '4 mai', '6 mai', '8 mai', '10 mai', '12 mai', '14 mai', '16 mai', '18 mai', '20 mai', '22 mai', '24 mai', '26 mai'];

  const values =
    metric === 'averageProgressDelta'
      ? source.progress
      : metric === 'averageAttempts'
        ? source.attempts
        : source.success;

  const maxValue =
    metric === 'averageAttempts'
      ? Math.max(4, Math.ceil(Math.max(...values, 0)))
      : metric === 'averageProgressDelta'
        ? Math.max(20, Math.ceil(Math.max(...values, 0) / 5) * 5)
        : 100;
  const minValue = metric === 'averageProgressDelta' ? Math.min(-20, Math.floor(Math.min(...values, 0) / 5) * 5) : 0;
  const range = Math.max(1, maxValue - minValue);
  const meta = getStatsMetricMeta(metric);
  const path = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / Math.max(values.length - 1, 1)) * 760;
      const y = 300 - ((value - minValue) / range) * 270;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return {
    labels,
    meta,
    path,
    yAxisLabels: [maxValue, minValue + range * 0.75, minValue + range * 0.5, minValue + range * 0.25, minValue].map((value) => meta.formatAxis(Number(value))),
  };
}

export function StatsOverviewView({ errorMessage, isError, isLoading, onOpenTraining, statsOverview }: { errorMessage?: string; isError: boolean; isLoading: boolean; onOpenTraining: (trainingIri: string, view?: View) => void; statsOverview: StatsOverview | null; }) {
  const [periodFilter, setPeriodFilter] = useState('30');
  const [selectedTrainingFilter, setSelectedTrainingFilter] = useState('all');
  const [evolutionMode, setEvolutionMode] = useState<StatsMetricOption>('successRate');
  const [cycleWindow, setCycleWindow] = useState('5 derniers cycles');

  const trainingBreakdown = statsOverview?.trainingBreakdown ?? [];
  const selectedSummary = selectedTrainingFilter === 'all'
    ? null
    : trainingBreakdown.find((summary) => summary.training['@id'] === selectedTrainingFilter) ?? null;
  const topCards = statsOverview ? buildStatsCardRows(statsOverview, selectedSummary) : [];
  const activeTrainings = trainingBreakdown.slice(0, 5);
  const focusedCycleRows = selectedSummary ? buildFocusedCycleRows(selectedSummary) : [];
  const availableDays = statsOverview ? getStatsAvailableDays(statsOverview, selectedSummary) : 7;
  const periodOptions = buildStatsPeriodOptions(availableDays);
  const selectedPeriodLabel = periodOptions.find((option) => option.value === periodFilter)?.label ?? periodOptions[1]?.label ?? '7 derniers jours';
  const chartSeries = statsOverview ? buildStatsMetricSeries(evolutionMode, selectedSummary, statsOverview, focusedCycleRows) : null;
  const xAxisLabels = chartSeries?.labels ?? [];
  const maxFocusedAttempts = Math.max(...focusedCycleRows.map((row) => row.attempts), 3);

  return (
    <div className="wp-page wp-global-stats-page">
      <header className="wp-global-stats-page__header">
        <div>
          <h1>{selectedSummary ? `Statistiques · ${selectedSummary.training.name}` : 'Statistiques globales'}</h1>
          <p>Vue d'ensemble des performances et des entraînements.</p>
        </div>
        <div className="wp-global-stats-controls">
          <label className="wp-global-stats-filter">
            <span className="wp-global-stats-filter__icon wp-global-stats-filter__icon--dot" aria-hidden="true">•</span>
            <select value={selectedTrainingFilter} onChange={(event) => setSelectedTrainingFilter(event.target.value)}>
              <option value="all">Tous les trainings</option>
              {trainingBreakdown.map((summary) => (
                <option key={summary.training['@id']} value={summary.training['@id']}>
                  {summary.training.name}
                </option>
              ))}
            </select>
          </label>
          <label className="wp-global-stats-filter">
            <span className="wp-global-stats-filter__icon wp-global-stats-filter__icon--dot" aria-hidden="true">•</span>
            <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
              {periodOptions.map((option) => (
                <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {isLoading && <p className="wp-empty">Chargement des statistiques...</p>}
      {isError && <p className="alert error-alert">{errorMessage}</p>}

      {statsOverview ? (
        <>
          <section className="wp-global-stats-kpis">
            {topCards.map((card) => {
              return (
                <article className="wp-global-stats-kpi" key={card.label}>
                  <div className="wp-global-stats-kpi__header">
                    <span className={`wp-global-stats-kpi__icon ${getStatsToneClass(card.tone)}`} aria-hidden="true" />
                    <span>{card.label}</span>
                  </div>
                  <strong>{card.value}</strong>
                  <small className={card.delta.startsWith('-') ? 'is-negative' : undefined}>{card.delta} {card.deltaLabel}</small>
                </article>
              );
            })}
          </section>

          {selectedSummary ? (
            <>
              <section className="wp-global-stats-grid wp-global-stats-grid--top">
                <article className="wp-panel wp-global-stats-panel wp-global-stats-panel--chart">
                  <div className="wp-global-stats-panel__header">
                    <div>
                      <h2>Évolution des cycles</h2>
                      <p className="wp-global-stats-panel__subtitle">{selectedPeriodLabel}</p>
                    </div>
                    <label className="wp-global-stats-select">
                      <select value={evolutionMode} onChange={(event) => setEvolutionMode(event.target.value as StatsMetricOption)}>
                        <option value="successRate">Taux de réussite</option>
                        <option value="averageProgressDelta">Progression moyenne</option>
                        <option value="averageAttempts">Tentatives moyennes</option>
                      </select>
                    </label>
                  </div>
                  {chartSeries ? (
                    <div className="wp-global-stats-chart-shell wp-global-stats-chart-shell--focused">
                      <div className="wp-global-stats-chart-yaxis">
                        {chartSeries.yAxisLabels.map((label) => <span key={label}>{label}</span>)}
                      </div>
                      <div className="wp-global-stats-chart-main">
                        <svg viewBox="0 0 760 300" preserveAspectRatio="none" aria-hidden="true">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <line key={`focused-h-${index}`} x1="0" x2="760" y1={index * 60} y2={index * 60} className="grid-line" />
                          ))}
                          {Array.from({ length: focusedCycleRows.length }).map((_, index) => {
                            const axisStep = focusedCycleRows.length > 1 ? 760 / (focusedCycleRows.length - 1) : 0;
                            return <line key={`focused-v-${index}`} y1="0" y2="300" x1={index * axisStep} x2={index * axisStep} className="grid-line grid-line--vertical" />;
                          })}
                          <path d={chartSeries.path} className={chartSeries.meta.lineClassName} />
                        </svg>
                        <div className="wp-global-stats-chart-xaxis wp-global-stats-chart-xaxis--compact">
                          {xAxisLabels.map((label) => <span key={label}>{label}</span>)}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>

                <article className="wp-panel wp-global-stats-panel wp-global-stats-panel--side wp-global-stats-focus-card">
                  <div className="wp-global-stats-focus-card__header">
                    <span className="wp-global-stats-training-icon tone-0" aria-hidden="true">{getTrainingGlyph(selectedSummary.training.name)}</span>
                    <div>
                      <h2>{selectedSummary.training.name}</h2>
                      <p>{truncateTrainingDescription(selectedSummary.training.description, 110) || 'Training ciblé pour analyser la dynamique du cycle, le volume et les zones à retravailler.'}</p>
                    </div>
                  </div>
                  <div className="wp-global-stats-focus-card__meta">
                    <span>{selectedSummary.puzzleCount} puzzles</span>
                    <span>{selectedSummary.attemptCount} tentatives</span>
                    <span>{cycleStatusLabel(selectedSummary)}</span>
                    <span>{selectedSummary.latestAttemptedAt ? formatRecentActivityTime(selectedSummary.latestAttemptedAt) : 'Aucune activité récente'}</span>
                  </div>
                  <div className="wp-global-stats-focus-card__stats">
                    <article>
                      <strong>{selectedSummary.solvedCount}</strong>
                      <span>Résolus</span>
                    </article>
                    <article>
                      <strong>{selectedSummary.failedCount}</strong>
                      <span>À revoir</span>
                    </article>
                    <article>
                      <strong>{selectedSummary.pendingCount}</strong>
                      <span>Restants</span>
                    </article>
                  </div>
                  <button className="wp-global-stats-link" type="button" onClick={() => onOpenTraining(selectedSummary.training['@id'], 'detail')}>
                    Ouvrir le détail du training <span>›</span>
                  </button>
                </article>
              </section>

              <section className="wp-global-stats-grid wp-global-stats-grid--bottom">
                <article className="wp-panel wp-global-stats-panel wp-global-stats-panel--bars">
                  <div className="wp-global-stats-panel__header">
                    <h2>Performance par cycle</h2>
                    <label className="wp-global-stats-select">
                      <select value={cycleWindow} onChange={(event) => setCycleWindow(event.target.value)}>
                        <option>5 derniers cycles</option>
                        <option>10 derniers cycles</option>
                      </select>
                    </label>
                  </div>
                  <div className="wp-global-stats-legend">
                    <span className="is-lime-dot">Taux de réussite</span>
                    <span className="is-green-dot">Progression</span>
                    <span className="is-violet-dot">Tentatives moyennes</span>
                  </div>
                  <div className="wp-global-stats-bars">
                    {focusedCycleRows.map((row) => (
                      <div className="wp-global-stats-bars__group" key={row.cycleLabel}>
                        <div className="wp-global-stats-bars__columns">
                          <span className="bar-success" style={{ height: `${row.successRate}%` }} />
                          <span className="bar-progress" style={{ height: `${Math.max(16, row.progression + 24)}%` }} />
                          <span className="bar-attempts" style={{ height: `${Math.max(20, (row.attempts / maxFocusedAttempts) * 100)}%` }} />
                        </div>
                        <strong>{row.cycleLabel}</strong>
                        <small>{row.period}</small>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="wp-panel wp-global-stats-panel wp-global-stats-panel--detail">
                  <div className="wp-global-stats-panel__header">
                    <h2>Détail des cycles</h2>
                  </div>
                  <div className="wp-global-stats-table wp-global-stats-table--cycles">
                    <div className="wp-global-stats-table__head">
                      <span>Cycle</span>
                      <span>Période</span>
                      <span>Taux de réussite</span>
                      <span>Progression</span>
                      <span>Tentatives moyennes</span>
                      <span>Problèmes/session</span>
                    </div>
                    {focusedCycleRows.map((row) => (
                      <div className="wp-global-stats-table__row" key={row.cycleLabel}>
                        <strong>{row.cycleLabel}</strong>
                        <span>{row.period}</span>
                        <span className={row.successRate < 55 ? 'is-amber' : 'is-lime'}>{row.successRate}%</span>
                        <span className={row.progression < 0 ? 'is-red' : 'is-lime'}>{row.progression > 0 ? `+${row.progression}%` : row.progression === 0 ? '—' : `${row.progression}%`}</span>
                        <span>{row.attempts.toFixed(1)}</span>
                        <span>{row.sessions}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </>
          ) : (
            <section className="wp-global-stats-grid wp-global-stats-grid--top">
              <article className="wp-panel wp-global-stats-panel wp-global-stats-panel--chart">
                <div className="wp-global-stats-panel__header">
                  <div>
                    <h2>Évolution des cycles</h2>
                    <p className="wp-global-stats-panel__subtitle">{selectedPeriodLabel}</p>
                  </div>
                  <label className="wp-global-stats-select">
                    <select value={evolutionMode} onChange={(event) => setEvolutionMode(event.target.value as StatsMetricOption)}>
                      <option value="successRate">Taux de réussite</option>
                      <option value="averageProgressDelta">Progression moyenne</option>
                      <option value="averageAttempts">Tentatives moyennes</option>
                    </select>
                  </label>
                </div>
                {chartSeries ? (
                  <div className="wp-global-stats-chart-shell">
                    <div className="wp-global-stats-chart-yaxis">
                      {chartSeries.yAxisLabels.map((label) => <span key={label}>{label}</span>)}
                    </div>
                    <div className="wp-global-stats-chart-main">
                      <svg viewBox="0 0 760 300" preserveAspectRatio="none" aria-hidden="true">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <line key={`h-${index}`} x1="0" x2="760" y1={index * 60} y2={index * 60} className="grid-line" />
                        ))}
                        {Array.from({ length: 15 }).map((_, index) => (
                          <line key={`v-${index}`} y1="0" y2="300" x1={index * 54.3} x2={index * 54.3} className="grid-line grid-line--vertical" />
                        ))}
                        <path d={chartSeries.path} className={chartSeries.meta.lineClassName} />
                      </svg>
                      <div className="wp-global-stats-chart-xaxis">
                        {xAxisLabels.map((label) => <span key={label}>{label}</span>)}
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>

              <article className="wp-panel wp-global-stats-panel wp-global-stats-panel--side">
                <div className="wp-global-stats-panel__header">
                  <h2>Trainings les plus actifs</h2>
                  <button className="wp-global-stats-title-link" type="button">Voir tout</button>
                </div>
                <div className="wp-global-stats-table wp-global-stats-table--trainings">
                  <div className="wp-global-stats-table__head">
                    <span>Entraînement</span>
                    <span>Sessions</span>
                    <span>Réussite</span>
                    <span>Progression</span>
                  </div>
                  {activeTrainings.map((summary, index) => {
                    const handled = Math.max(1, summary.solvedCount + summary.failedCount);
                    const successRate = Math.max(40, Math.min(92, Math.round((summary.solvedCount / handled) * 100) || (statsOverview.successRate - index * 3)));
                    const progression = index === activeTrainings.length - 1 ? -2 : Math.max(5, Math.round(successRate / 8));
                    return (
                      <button className="wp-global-stats-table__row" key={summary.training['@id']} type="button" onClick={() => onOpenTraining(summary.training['@id'], 'detail')}>
                        <span className="wp-global-stats-training-cell">
                          <span className={`wp-global-stats-training-icon tone-${index % 5}`} aria-hidden="true">{getTrainingGlyph(summary.training.name)}</span>
                          <strong>{summary.training.name}</strong>
                        </span>
                        <span>{Math.max(18, Math.round(summary.attemptCount / 2.2) || 18)}</span>
                        <span className={successRate < 50 ? 'is-red' : 'is-lime'}>{successRate}%</span>
                        <span className={progression < 0 ? 'is-red' : 'is-lime'}>{progression > 0 ? `+${progression}%` : `${progression}%`}</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
export function SettingsOverviewView({ errorMessage, isError, isLoading, onBackToDashboard, settingsOverview }: { errorMessage?: string; isError: boolean; isLoading: boolean; onBackToDashboard: () => void; settingsOverview: UserSettingsOverview | null; }) {
  return (
    <div className="wp-page wp-settings-page">
      <PageHeader
        eyebrow="Paramètres"
        title="Compte & Preferences"
        description="Gère le profil, les préférences d entraînement et les intégrations a venir."
        action={<button className="wp-secondary" type="button" onClick={onBackToDashboard}>Retour au tableau de bord</button>}
      />
      {isLoading && <p className="wp-empty">Chargement des parametres...</p>}
      {isError && <p className="alert error-alert">{errorMessage}</p>}
      {settingsOverview && (
        <>
          <section className="wp-dashboard-overview wp-settings-kpis">
            <Stat label="Entraînements actifs" value={String(settingsOverview.workspace.activeTrainingCount)} />
            <Stat label="Problèmes" value={String(settingsOverview.workspace.puzzleCount)} />
            <Stat label="Archives" value={String(settingsOverview.workspace.archivedTrainingCount)} />
            <Stat label="Exports" value={settingsOverview.integrations.exportReady ? 'Prets' : 'A venir'} />
          </section>

          <div className="wp-two-columns wp-settings-main-grid">
            <section className="wp-panel wp-settings-profile-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Profil</p>
                  <h3>{settingsOverview.user.email}</h3>
                </div>
              </div>
              <p className="wp-detail-highlight-copy">
                Compte cree {settingsOverview.user.createdAt ? formatDateTime(settingsOverview.user.createdAt) : 'date indisponible'}. Cette base prepare les futurs reglages compte, securite et personnalisation.
              </p>
              <div className="wp-inline-metrics wp-inline-metrics-spaced">
                <span>{settingsOverview.user.roles.join(', ')}</span>
                <span>{settingsOverview.workspace.activeTrainingCount} training(s) actif(s)</span>
                <span>{settingsOverview.workspace.archivedTrainingCount} archive(s)</span>
              </div>
              <div className="wp-import-preview-list">
                <article className="wp-import-preview-row">
                  <strong>Dernier training visible</strong>
                  <small>{settingsOverview.workspace.latestTrainingName ?? 'Aucun training cree pour le moment.'}</small>
                </article>
                <article className="wp-import-preview-row">
                  <strong>Volume courant</strong>
                  <small>{settingsOverview.workspace.trainingCount} training(s) et {settingsOverview.workspace.puzzleCount} puzzle(s) suivis.</small>
                </article>
              </div>
            </section>

            <section className="wp-panel wp-settings-intégrations-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Integrations</p>
                  <h3>Etat de preparation</h3>
                </div>
              </div>
              <div className="wp-settings-integration-list">
                <article className="wp-settings-integration-item">
                  <div>
                    <strong>Lichess</strong>
                    <small>Analyse de parties et synchronisation future.</small>
                  </div>
                  <span className={`wp-status-pill ${settingsOverview.integrations.lichessConnected ? 'success' : 'info'}`}>{getIntegrationLabel(settingsOverview.integrations.lichessConnected)}</span>
                </article>
                <article className="wp-settings-integration-item">
                  <div>
                    <strong>Chess.com</strong>
                    <small>Import de parties et suivi de progression.</small>
                  </div>
                  <span className={`wp-status-pill ${settingsOverview.integrations.chessComConnected ? 'success' : 'info'}`}>{getIntegrationLabel(settingsOverview.integrations.chessComConnected)}</span>
                </article>
                <article className="wp-settings-integration-item">
                  <div>
                    <strong>Exports</strong>
                    <small>Exports et reporting pour la suite produit.</small>
                  </div>
                  <span className={`wp-status-pill ${settingsOverview.integrations.exportReady ? 'success' : 'warning'}`}>{getIntegrationLabel(settingsOverview.integrations.exportReady)}</span>
                </article>
              </div>
            </section>
          </div>

          <div className="wp-two-columns wp-settings-secondary-grid">
            <section className="wp-panel wp-settings-préférences-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Preferences</p>
                  <h3>Base Woodpecker actuelle</h3>
                </div>
              </div>
              <div className="wp-import-preview-list">
                <article className="wp-import-preview-row">
                  <strong>Limite d erreurs de reference</strong>
                  <small>{settingsOverview.preferencesPreview.defaultMistakeLimit} erreur(s) comme point de depart.</small>
                </article>
                <article className="wp-import-preview-row">
                  <strong>Verrouillage des sets</strong>
                  <small>{settingsOverview.preferencesPreview.lockTrainingAfterCycle ? 'Actif par defaut pour garder le meme set pendant un cycle.' : 'Non active.'}</small>
                </article>
                <article className="wp-import-preview-row">
                  <strong>Solveur suivi</strong>
                  <small>{settingsOverview.preferencesPreview.trackedSolverByDefault ? 'Les tentatives sauvegardees sont prioritaires des qu un cycle existe.' : 'Le mode libre reste prioritaire.'}</small>
                </article>
              </div>
            </section>

            <section className="wp-panel wp-settings-workspace-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Etat du compte</p>
                  <h3>Workspace</h3>
                </div>
              </div>
              <div className="wp-import-preview-list">
                <article className="wp-import-preview-row">
                  <strong>Etat export</strong>
                  <small>{settingsOverview.integrations.exportReady ? 'Le socle export est pret a etre branche.' : 'Le socle export reste en preparation.'}</small>
                </article>
                <article className="wp-import-preview-row">
                  <strong>Integrations futures</strong>
                  <small>Cette base servira ensuite aux vrais reglages utilisateur et aux connexions Lichess / Chess.com.</small>
                </article>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
export function FuturePageView({ ctaLabel, description, eyebrow, onBackToDashboard, points, title }: { ctaLabel: string; description: string; eyebrow: string; onBackToDashboard: () => void; points: string[]; title: string; }) {
  return (
    <div className="wp-page">
      <PageHeader eyebrow={eyebrow} title={title} description={description} action={<button className="wp-secondary" type="button" onClick={onBackToDashboard}>Retour au tableau de bord</button>} />
      <div className="wp-detail-overview-grid">
        <section className="wp-panel wp-detail-highlight">
          <div className="wp-panel-title">
            <p className="eyebrow">Bientot</p>
            <h3>Page en preparation</h3>
          </div>
          <p className="wp-detail-highlight-copy">Cette zone fait deja partie du parcours produit cible. On la garde visible pour stabiliser la navigation avant d'y brancher les vraies donnees.</p>
          <div className="wp-inline-metrics">
            <span>Structure produit posee</span>
            <span>Etat placeholder assume</span>
            <span>Donnees a venir</span>
          </div>
        </section>
        <section className="wp-panel wp-detail-highlight subdued">
          <div className="wp-panel-title">
            <p className="eyebrow">Prochain contenu</p>
            <h3>Ce qui arrivera ici</h3>
          </div>
          <div className="wp-import-preview-list">
            {points.map((point) => <article className="wp-import-preview-row" key={point}><strong>{point}</strong><small>Placeholder produit present pour preparer la future implementation.</small></article>)}
          </div>
        </section>
      </div>
      <div className="wp-empty-card">
        <h3>Page encore en construction</h3>
        <p>Le squelette est en place pour la navigation, l'état vide et la future maquette. La prochaine étape sera de brancher les read models et l'UX détaillée.</p>
        <button className="wp-primary" type="button" onClick={onBackToDashboard}>{ctaLabel}</button>
      </div>
    </div>
  );
}

export function ImportView({ csvErrors, csvFileName, csvRows, errorMessage, isError, isPending, onBackToDashboard, onFileParsed, onResetFile, onSubmit, puzzleListIsLocked, selectedTraining }: { csvErrors: string[]; csvFileName: string; csvRows: PuzzleCsvRow[]; errorMessage?: string; isError: boolean; isPending: boolean; onBackToDashboard: () => void; onFileParsed: (fileName: string, rows: PuzzleCsvRow[], errors: string[]) => void; onResetFile: () => void; onSubmit: () => void; puzzleListIsLocked: boolean; selectedTraining: Training | null; }) {
  const previewRows = csvRows.slice(0, 5);
  const hasImportReadyRows = csvRows.length > 0 && csvErrors.length === 0;

  return (
    <div className="wp-page wp-import-page">
      <PageHeader
        action={!selectedTraining ? <button className="wp-secondary" type="button" onClick={onBackToDashboard}>Retour au tableau de bord</button> : undefined}
        eyebrow="Import CSV"
        title="Importer des puzzles"
        description={selectedTraining ? `Import cible : ${selectedTraining.name}` : 'Sélectionne d abord un entraînement depuis le tableau de bord.'}
      />

      <div className="wp-detail-overview-grid wp-import-top-grid">
        <section className="wp-panel wp-detail-highlight wp-import-highlight">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">Controle</p>
              <h3>{hasImportReadyRows ? 'Import pret' : 'Verification en cours'}</h3>
            </div>
          </div>
          <p className="wp-detail-highlight-copy">
            {hasImportReadyRows
              ? 'Le fichier semble coherent. Tu peux importer ce lot dans le training sélectionne.'
              : 'Charge un CSV puis corrige les erreurs detectees avant l import definitif.'}
          </p>
          <div className="wp-inline-metrics">
            <span>{csvRows.length} puzzle(s) detectes</span>
            <span>{csvErrors.length} erreur(s)</span>
            <span>{selectedTraining ? selectedTraining.name : 'Aucun training cible'}</span>
          </div>
        </section>

        <section className="wp-panel wp-detail-highlight subdued wp-import-format-card">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">Format attendu</p>
              <h3>Points verifies</h3>
            </div>
          </div>
          <div className="wp-inline-metrics wp-inline-metrics-spaced">
            <span>Moves ou solution obligatoire</span>
            <span>FEN valide si fournie</span>
            <span>Coups UCI legaux</span>
            <span>Doublons detectes</span>
          </div>
        </section>
      </div>

      {!selectedTraining && (
        <div className="wp-empty-card">
          <h3>Aucun training cible</h3>
          <p>Choisis d'abord un entraînement depuis le tableau de bord pour ouvrir l import CSV dans le bon contexte.</p>
          <button className="wp-primary" type="button" onClick={onBackToDashboard}>Choisir un entraînement</button>
        </div>
      )}

      <div className="wp-two-columns wp-import-main-grid">
        <section className="wp-panel wp-import-upload-card">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">1. Charger votre fichier CSV</p>
              <h3>CSV compatible Lichess</h3>
            </div>
          </div>

          <p className="muted">
            Colonnes attendues : <code>PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags</code>. Seule <code>Moves</code> est obligatoire.
          </p>

          <div className="wp-inline-metrics wp-inline-metrics-spaced">
            <span>Separateur virgule ou point-virgule</span>
            <span>Notation UCI uniquement</span>
            <span>Les lignes dupliquees sont refusees</span>
          </div>

          {puzzleListIsLocked && <p className="alert warning-alert">Import desactive : un cycle existe deja, donc la liste de puzzles est verrouillee.</p>}

          {csvFileName && (
            <div className="wp-import-file-pill">
              <strong>{csvFileName}</strong>
              <button className="wp-secondary" type="button" onClick={onResetFile}>Retirer</button>
            </div>
          )}

          <label className="wp-dropzone wp-dropzone-large">
            <span>Glisse-depose ton fichier CSV ici</span>
            <small>ou clique pour choisir un fichier. Coups en notation UCI uniquement.</small>
            <input
              accept=".csv,text/csv"
              disabled={!selectedTraining || puzzleListIsLocked}
              type="file"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  onResetFile();
                  return;
                }
                const result = parsePuzzleCsv(await file.text());
                onFileParsed(file.name, result.rows, result.errors);
              }}
            />
          </label>
        </section>

        <section className="wp-panel wp-import-summary-card">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">2. Resume de l import</p>
              <h3>Previsualisation</h3>
            </div>
          </div>

          <div className="wp-stats compact wp-import-stats">
            <Stat label="Puzzles detectes" value={String(csvRows.length)} />
            <Stat label="Erreurs detectees" value={String(csvErrors.length)} />
          </div>

          {csvErrors.length > 0 && (
            <div className="alert error-alert">
              <p>Erreurs de validation :</p>
              <ul>
                {csvErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}

          {csvErrors.length === 0 && csvRows.length > 0 && <p className="alert info-alert">Le fichier est valide et pret a etre importe.</p>}

          {previewRows.length > 0 && (
            <div className="wp-import-preview-list wp-import-preview-table">
              {previewRows.map((row, index) => (
                <article className="wp-import-preview-row" key={`${row.fen ?? 'initial'}-${row.solution.join('-')}-${index}`}>
                  <strong>Puzzle {index + 1}</strong>
                  <span>{row.solution.join(' ')}</span>
                  <small>{row.themes.length > 0 ? row.themes.join(', ') : 'Sans theme'}{' - '}{row.rating ? `Rating ${row.rating}` : 'Rating libre'}</small>
                </article>
              ))}
            </div>
          )}

          {isError && <p className="alert error-alert">{errorMessage}</p>}

          <button className="wp-primary full" disabled={!selectedTraining || puzzleListIsLocked || isPending || csvRows.length === 0 || csvErrors.length > 0} type="button" onClick={onSubmit}>
            {isPending ? 'Import...' : `Importer ${csvRows.length} puzzle(s)`}
          </button>
        </section>
      </div>
    </div>
  );
}










