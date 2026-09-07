import type { HistoryItemStatus, HistoryTimelineItem } from '../types/history.types';
import type { HistoryFilterState } from '../types/historyView.types';

export const DEFAULT_FILTERS: HistoryFilterState = {
  activity: 'attempt',
  pageSize: 25,
  periodDays: 30,
  search: '',
  status: 'all',
  training: 'all',
};

export const PERIOD_OPTIONS: Array<{ label: string; value: HistoryFilterState['periodDays'] }> = [
  { label: '7 derniers jours', value: 7 },
  { label: '14 derniers jours', value: 14 },
  { label: '30 derniers jours', value: 30 },
  { label: '60 derniers jours', value: 60 },
  { label: '90 derniers jours', value: 90 },
  { label: 'Toute la période', value: 'all' },
];

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const STATUS_META: Record<HistoryItemStatus, { badgeClassName: string; label: string }> = {
  failed: { badgeClassName: 'is-failed', label: 'Raté' },
  solved: { badgeClassName: 'is-solved', label: 'Réussi' },
};

export const ACTIVITY_LABELS: Record<Exclude<HistoryFilterState['activity'], 'all'>, string> = {
  attempt: 'Tentatives',
  connection: 'Connexions',
  disconnection: 'Déconnexions',
};

export function filterByPeriod(item: HistoryTimelineItem, periodDays: HistoryFilterState['periodDays']) {
  if (periodDays === 'all') {
    return true;
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (periodDays - 1));
  start.setHours(0, 0, 0, 0);

  const occurredAt = new Date(item.occurredAt);
  return occurredAt >= start && occurredAt <= end;
}

export function buildEmptyMessage(filters: HistoryFilterState, supportsConnectionHistory: boolean) {
  if ((filters.activity === 'connection' || filters.activity === 'disconnection') && !supportsConnectionHistory) {
    return 'Aucun événement de connexion ou déconnexion persisté n\'est disponible pour le moment.';
  }

  if (filters.search.trim()) {
    return 'Aucune activité ne correspond à ta recherche.';
  }

  if (
    filters.activity !== DEFAULT_FILTERS.activity
    || filters.training !== DEFAULT_FILTERS.training
    || filters.status !== DEFAULT_FILTERS.status
    || filters.periodDays !== DEFAULT_FILTERS.periodDays
  ) {
    return 'Aucune activité ne correspond aux filtres sélectionnés.';
  }

  return 'Aucune activité pour le moment.';
}

export function buildPageNumbers(currentPage: number, totalPages: number) {
  const pages: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [];

  if (totalPages <= 5) {
    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page);
    }

    return pages;
  }

  pages.push(1);

  if (currentPage > 3) {
    pages.push('ellipsis-left');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis-right');
  }

  pages.push(totalPages);

  return pages;
}

export function getStatusLabel(status: HistoryItemStatus) {
  return STATUS_META[status].label;
}

export function getPeriodLabel(periodDays: HistoryFilterState['periodDays']) {
  return PERIOD_OPTIONS.find((option) => option.value === periodDays)?.label ?? 'Période';
}

export function isAttemptItem(item: HistoryTimelineItem) {
  return item.activityType === 'attempt';
}

export function isAuthOnlyFilter(activity: HistoryFilterState['activity']) {
  return activity === 'connection' || activity === 'disconnection';
}
