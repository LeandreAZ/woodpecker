
export function formatCompactDate(value?: string | null) {
  if (!value) return 'Dates indisponibles';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dates indisponibles';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function getAttemptSummaryLabel(attemptCount: number) {
  if (attemptCount <= 0) return 'Aucune tentative enregistrée pour ce puzzle.';
  if (attemptCount === 1) return '1 tentative enregistrée pour ce puzzle.';
  return `${attemptCount} tentatives enregistrées pour ce puzzle.`;
}

export function getRingValueClassName(value: string) {
  if (value.length >= 6) return 'wp-solver-topbar-v2__ring-value is-xcompact';
  if (value.length >= 4) return 'wp-solver-topbar-v2__ring-value is-compact';
  return 'wp-solver-topbar-v2__ring-value';
}
