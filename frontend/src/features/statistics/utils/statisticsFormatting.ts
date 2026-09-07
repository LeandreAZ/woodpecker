import type { TrainingCycleSummary } from '../../trainings/types/training.types';

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function truncateLabel(value: string, maxLength = 18) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

export function formatCompactDate(value?: string | null) {
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

export function formatCyclePeriod(cycle: TrainingCycleSummary) {
  const started = formatCompactDate(cycle.cycle.startedAt);
  const completed = cycle.cycle.completedAt ? formatCompactDate(cycle.cycle.completedAt) : null;
  return completed ? `${started} - ${completed}` : started;
}

export function formatAverageAttempts(value?: number | null) {
  const normalized = Math.round((value ?? 0) * 10) / 10;
  return normalized.toLocaleString('fr-FR', {
    minimumFractionDigits: normalized % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function formatProgressDelta(value?: number | null) {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${value > 0 ? '+' : ''}${value}%`;
}

export function formatAveragePuzzleTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0 ? `${minutes}m${remainingSeconds}s` : `${minutes}m`;
}

export function formatPercentShare(value: number, total: number) {
  if (total <= 0) {
    return '0%';
  }

  return `${Math.round((value / total) * 100)}%`;
}
