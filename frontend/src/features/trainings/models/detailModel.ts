import { CheckCircle2, CircleOff, Clock3, List, RefreshCw, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { formatDateTime } from '../utils/training.utils';
import type { CyclePuzzle, CycleStats, TrainingAnalytics, TrainingAttemptSummary, TrainingCycleSummary, TrainingPuzzle, TrainingSummary } from '../types/training.types';
import type { DetailStat } from '../types/detail.types';
import type { PuzzleRow } from '../types/detail.types';
import type { AttemptCard } from '../types/detail.types';

export function formatCompactDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCompactDateTime(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDecimal(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }

  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function getDifficultyLabel(rating?: number | null) {
  if (!rating) {
    return 'Libre';
  }
  if (rating < 1400) {
    return 'Facile';
  }
  if (rating < 1900) {
    return 'Moyen';
  }
  return 'Difficile';
}

function getProgressDelta(cycleSummaries: TrainingCycleSummary[]) {
  if (cycleSummaries.length < 2) {
    return null;
  }

  const current = cycleSummaries[0].successRate ?? cycleSummaries[0].progressPercent;
  const previous = cycleSummaries[1].successRate ?? cycleSummaries[1].progressPercent;

  return current - previous;
}

function getSuccessRateValue(_summary: TrainingSummary | null, _analytics: TrainingAnalytics | null, cycleStats: CycleStats) {
  const attemptedPuzzleCount = cycleStats.solved + cycleStats.failed;
  if (attemptedPuzzleCount <= 0) {
    return 0;
  }

  return Math.round((cycleStats.solved / attemptedPuzzleCount) * 100);
}

function getAverageAttemptsValue(summary: TrainingSummary | null, cycleStats: CycleStats) {
  const directValue = summary?.latestCycleSummary?.averageAttempts ?? null;
  if (directValue !== null && directValue !== undefined) {
    return directValue;
  }

  const attemptedPuzzleCount = cycleStats.solved + cycleStats.failed;
  if (attemptedPuzzleCount <= 0) {
    return null;
  }

  const totalAttempts = summary?.latestCycleSummary?.attemptCount ?? summary?.attemptCount ?? 0;
  if (totalAttempts <= 0) {
    return null;
  }

  return totalAttempts / attemptedPuzzleCount;
}

function getPuzzleAttemptSummary(
  trainingPuzzle: TrainingPuzzle,
  cyclePuzzle: CyclePuzzle | null,
  latestAttempts: TrainingAttemptSummary[],
  hasStartedCycle: boolean,
  currentCycleNumber?: number | null,
) {
  const cycleScopedAttempts = currentCycleNumber != null && latestAttempts.some((item) => item.cycleNumber != null)
    ? latestAttempts.filter((item) => item.cycleNumber === currentCycleNumber)
    : latestAttempts;
  const attempt = cycleScopedAttempts.find((item) => item.trainingPuzzlePosition === trainingPuzzle.position) ?? null;

  if (!cyclePuzzle) {
    return {
      attemptedAtLabel: '—',
      attemptsLabel: hasStartedCycle ? '0' : '—',
      firstAttemptLabel: '—',
      statusLabel: 'Non tenté',
      statusTone: 'neutral' as const,
    };
  }

  if (cyclePuzzle.status === 'pending') {
    return {
      attemptedAtLabel: '—',
      attemptsLabel: '0',
      firstAttemptLabel: '—',
      statusLabel: 'Non tenté',
      statusTone: 'neutral' as const,
    };
  }

  if (!attempt) {
    return {
      attemptedAtLabel: formatCompactDateTime(cyclePuzzle.completedAt),
      attemptsLabel: String(cyclePuzzle.attemptCount ?? cyclePuzzle.completedAttemptCount ?? cyclePuzzle.attempts?.filter((item) => item.status !== 'in_progress').length ?? 1),
      firstAttemptLabel: '—',
      statusLabel: cyclePuzzle.status === 'solved' ? 'Résolu' : cyclePuzzle.status === 'in_progress' ? 'En cours' : 'Raté',
      statusTone: cyclePuzzle.status === 'solved' ? ('success' as const) : cyclePuzzle.status === 'in_progress' ? ('primary' as const) : ('danger' as const),
    };
  }

  const firstAttemptLabel = attempt.successful && attempt.mistakesCount === 0
    ? 'Oui'
    : cyclePuzzle.status === 'solved'
      ? 'Non'
      : 'Non';

  return {
    attemptedAtLabel: formatCompactDateTime(cyclePuzzle.completedAt ?? attempt.attemptedAt),
    attemptsLabel: String(cyclePuzzle.attemptCount ?? cyclePuzzle.completedAttemptCount ?? cyclePuzzle.attempts?.filter((item) => item.status !== 'in_progress').length ?? 1),
    firstAttemptLabel,
    statusLabel: cyclePuzzle.status === 'solved' ? 'Résolu' : cyclePuzzle.status === 'in_progress' ? 'En cours' : 'Raté',
    statusTone: cyclePuzzle.status === 'solved' ? ('success' as const) : cyclePuzzle.status === 'in_progress' ? ('primary' as const) : ('danger' as const),
  };
}

export function buildPuzzleRows(
  trainingPuzzles: TrainingPuzzle[],
  cyclePuzzles: CyclePuzzle[],
  latestAttempts: TrainingAttemptSummary[],
  hasStartedCycle: boolean,
  currentCycleNumber?: number | null,
): PuzzleRow[] {
  return trainingPuzzles.map((trainingPuzzle) => {
    const puzzle = typeof trainingPuzzle.puzzle === 'string' ? null : trainingPuzzle.puzzle;
    const cyclePuzzle = cyclePuzzles.find((item) => item.trainingPuzzle === trainingPuzzle['@id']) ?? null;
    const attemptSummary = getPuzzleAttemptSummary(trainingPuzzle, cyclePuzzle, latestAttempts, hasStartedCycle, currentCycleNumber);

    return {
      accessDisabled: !hasStartedCycle,
      attemptedAtLabel: attemptSummary.attemptedAtLabel,
      firstAttemptLabel: attemptSummary.firstAttemptLabel,
      id: trainingPuzzle['@id'],
      note: trainingPuzzle.personalNote ?? null,
      positionLabel: String(trainingPuzzle.position + 1),
      previewFen: puzzle?.fen,
      ratingLabel: getDifficultyLabel(puzzle?.rating),
      ratingValueLabel: puzzle?.rating ? String(puzzle.rating) : '—',
      statusLabel: attemptSummary.statusLabel,
      statusTone: attemptSummary.statusTone,
      attemptsLabel: attemptSummary.attemptsLabel,
    };
  });
}

export function buildStats(
  totalProblems: number,
  cycleStats: CycleStats,
  summary: TrainingSummary | null,
  analytics: TrainingAnalytics | null,
): DetailStat[] {
  const hasPlayedPuzzle = cycleStats.solved + cycleStats.failed > 0;
  const successRate = getSuccessRateValue(summary, analytics, cycleStats);
  const delta = getProgressDelta(summary?.cycleSummaries ?? []);
  const averageAttempts = getAverageAttemptsValue(summary, cycleStats);

  return [
    {
      icon: CheckCircle2,
      label: 'Taux de réussite',
      tone: 'success',
      value: hasPlayedPuzzle ? `${successRate}%` : '—',
    },
    {
      icon: !hasPlayedPuzzle || delta === null ? CircleOff : delta >= 0 ? TrendingUp : TrendingDown,
      label: 'Progression',
      tone: 'primary',
      value: !hasPlayedPuzzle || delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`,
    },
    {
      icon: List,
      label: 'Problèmes',
      tone: 'info',
      value: String(totalProblems),
    },
    {
      icon: CheckCircle2,
      label: 'Résolus',
      tone: 'success',
      value: String(cycleStats.solved),
    },
    {
      icon: XCircle,
      label: 'Ratés',
      tone: 'danger',
      value: String(cycleStats.failed),
    },
    {
      icon: Clock3,
      label: 'Restants',
      tone: 'neutral',
      value: String(cycleStats.pending),
    },
    {
      icon: RefreshCw,
      label: 'Tentatives moyennes',
      tone: 'violet',
      value: formatDecimal(averageAttempts),
    },
  ];
}

export function buildAttemptCards(latestAttempts: TrainingAttemptSummary[]): AttemptCard[] {
  return latestAttempts.slice(0, 5).map((attempt) => {
    const successfulOnFirstTry = attempt.successful && attempt.mistakesCount === 0;

    return {
      accent: attempt.successful ? 'success' : 'danger',
      icon: attempt.successful ? CheckCircle2 : XCircle,
      id: attempt['@id'],
      subtitle: successfulOnFirstTry
        ? 'Réussi du premier coup'
        : attempt.successful
          ? 'Réussi après plusieurs essais'
          : 'Échec enregistré',
      timestamp: formatDateTime(attempt.attemptedAt),
      title: attempt.successful ? 'Réussi' : 'Raté',
    };
  });
}

