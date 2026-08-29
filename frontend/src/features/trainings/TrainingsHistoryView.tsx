import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { TrainingLogoBadge } from './TrainingBranding';
import type { HistoryActivityType, HistoryItemStatus, HistoryOverview, HistoryTimelineItem } from './trainingsTypes';
import './history.css';

type HistoryFilterState = {
  activity: 'all' | HistoryActivityType;
  pageSize: number;
  periodDays: number | 'all';
  search: string;
  status: 'all' | HistoryItemStatus;
  training: string;
};

type TrainingsHistoryViewProps = {
  errorMessage?: string;
  historyOverview: HistoryOverview | null;
  isError: boolean;
  isLoading: boolean;
};

const DEFAULT_FILTERS: HistoryFilterState = {
  activity: 'attempt',
  pageSize: 25,
  periodDays: 30,
  search: '',
  status: 'all',
  training: 'all',
};

const PERIOD_OPTIONS: Array<{ label: string; value: HistoryFilterState['periodDays'] }> = [
  { label: '7 derniers jours', value: 7 },
  { label: '14 derniers jours', value: 14 },
  { label: '30 derniers jours', value: 30 },
  { label: '60 derniers jours', value: 60 },
  { label: '90 derniers jours', value: 90 },
  { label: 'Toute la période', value: 'all' },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const STATUS_META: Record<HistoryItemStatus, { badgeClassName: string; label: string }> = {
  failed: { badgeClassName: 'is-failed', label: 'Raté' },
  solved: { badgeClassName: 'is-solved', label: 'Réussi' },
};

const ACTIVITY_LABELS: Record<Exclude<HistoryFilterState['activity'], 'all'>, string> = {
  attempt: 'Tentatives',
  connection: 'Connexions',
  disconnection: 'Déconnexions',
};

function formatDesktopDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDesktopTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function formatCompactDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value)).replace(',', ' ');
}

function formatDuration(durationMilliseconds: number) {
  const totalSeconds = Math.max(0, Math.round(durationMilliseconds / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (seconds === 0) {
    return `${minutes}min`;
  }

  return `${minutes}min ${seconds}s`;
}

function filterByPeriod(item: HistoryTimelineItem, periodDays: HistoryFilterState['periodDays']) {
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

function buildEmptyMessage(filters: HistoryFilterState, supportsConnectionHistory: boolean) {
  if ((filters.activity === 'connection' || filters.activity === 'disconnection') && !supportsConnectionHistory) {
    return 'Aucun événement de connexion ou déconnexion persisté n\'est disponible pour le moment.';
  }

  if (filters.search.trim()) {
    return 'Aucune activité ne correspond à ta recherche.';
  }

  if (
    filters.activity !== DEFAULT_FILTERS.activity ||
    filters.training !== DEFAULT_FILTERS.training ||
    filters.status !== DEFAULT_FILTERS.status ||
    filters.periodDays !== DEFAULT_FILTERS.periodDays
  ) {
    return 'Aucune activité ne correspond aux filtres sélectionnés.';
  }

  return 'Aucune activité pour le moment.';
}

function buildPageNumbers(currentPage: number, totalPages: number) {
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

function getStatusLabel(status: HistoryItemStatus) {
  return STATUS_META[status].label;
}

function getPeriodLabel(periodDays: HistoryFilterState['periodDays']) {
  return PERIOD_OPTIONS.find((option) => option.value === periodDays)?.label ?? 'Période';
}

function isAttemptItem(item: HistoryTimelineItem) {
  return item.activityType === 'attempt';
}

function isAuthOnlyFilter(activity: HistoryFilterState['activity']) {
  return activity === 'connection' || activity === 'disconnection';
}

function HistoryStatusBadge({ status, statusLabel }: Pick<HistoryTimelineItem, 'status' | 'statusLabel'>) {
  if (!status) {
    return null;
  }

  const meta = STATUS_META[status];
  return <span className={`wp-training-history-status ${meta.badgeClassName}`}>{statusLabel || meta.label}</span>;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button className="wp-training-history-chip" type="button" onClick={onRemove}>
      <span>{label}</span>
      <X size={14} />
    </button>
  );
}

function TrainingsHistoryView({ errorMessage, historyOverview, isError, isLoading }: TrainingsHistoryViewProps) {
  const [filters, setFilters] = useState<HistoryFilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(filters.search.trim().toLowerCase());

  const items = historyOverview?.items ?? [];
  const availableTrainings = historyOverview?.availableTrainings ?? [];
  const supportsConnectionHistory = historyOverview?.supportsConnectionHistory ?? false;
  const authOnlyView = isAuthOnlyFilter(filters.activity);
  const activityOptions: Array<{ label: string; value: HistoryFilterState['activity'] }> = [
    { label: 'Tentatives', value: 'attempt' },
  ];

  if (supportsConnectionHistory) {
    activityOptions.push({ label: 'Connexions', value: 'connection' }, { label: 'Déconnexions', value: 'disconnection' });
  }

  activityOptions.push({ label: 'Toutes les activités', value: 'all' });

  const filteredItems = useMemo(() => items.filter((item) => {
    if (filters.activity !== 'all' && item.activityType !== filters.activity) {
      return false;
    }

    if (filters.training !== 'all' && item.training?.['@id'] !== filters.training) {
      return false;
    }

    if (filters.status !== 'all') {
      if (!isAttemptItem(item) || item.status !== filters.status) {
        return false;
      }
    }

    if (!filterByPeriod(item, filters.periodDays)) {
      return false;
    }

    if (!deferredSearch) {
      return true;
    }

    const searchTarget = [
      item.label,
      item.detail,
      item.statusLabel ?? '',
      item.training?.name,
      item.cycle ? `Cycle ${item.cycle.number}` : '',
      item.attemptNumber ? `Essai ${item.attemptNumber}` : '',
    ].join(' ').toLowerCase();

    return searchTarget.includes(deferredSearch);
  }), [deferredSearch, filters.activity, filters.periodDays, filters.status, filters.training, items]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / filters.pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((currentPage - 1) * filters.pageSize, currentPage * filters.pageSize);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const selectedTraining = availableTrainings.find((training) => training['@id'] === filters.training) ?? null;
  const activeChips = [
    filters.activity !== DEFAULT_FILTERS.activity
      ? { key: 'activity', label: ACTIVITY_LABELS[filters.activity], onRemove: () => setFilters((current) => ({ ...current, activity: DEFAULT_FILTERS.activity })) }
      : null,
    selectedTraining ? { key: 'training', label: selectedTraining.name, onRemove: () => setFilters((current) => ({ ...current, training: 'all' })) } : null,
    filters.status !== 'all' ? { key: 'status', label: getStatusLabel(filters.status), onRemove: () => setFilters((current) => ({ ...current, status: 'all' })) } : null,
    filters.periodDays !== DEFAULT_FILTERS.periodDays ? { key: 'period', label: getPeriodLabel(filters.periodDays), onRemove: () => setFilters((current) => ({ ...current, periodDays: DEFAULT_FILTERS.periodDays })) } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, filters.activity, filters.pageSize, filters.periodDays, filters.status, filters.training]);

  return (
    <div className="wp-page wp-training-history-page">
      <header className="wp-training-history-header">
        <h1>Historique</h1>
        <p>Retrouve l'ensemble de ton activité sur Woodpecker.</p>
      </header>

      <div className="wp-training-history-search">
        <Search size={18} />
        <input
          aria-label="Recherche historique"
          placeholder="Rechercher dans l'historique..."
          type="search"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        {filters.search ? (
          <button
            aria-label="Effacer la recherche"
            className="wp-training-history-search__clear"
            type="button"
            onClick={() => setFilters((current) => ({ ...current, search: '' }))}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="wp-training-history-filters-wrap">
        <div className="wp-training-history-filters">
          <label className="wp-training-history-filter">
            <span>Activité</span>
            <select value={filters.activity} onChange={(event) => setFilters((current) => ({ ...current, activity: event.target.value as HistoryFilterState['activity'] }))}>
              {activityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="wp-training-history-filter">
            <span>Entraînement</span>
            <select value={filters.training} onChange={(event) => setFilters((current) => ({ ...current, training: event.target.value }))}>
              <option value="all">Tous les entraînements</option>
              {availableTrainings.map((training) => (
                <option key={training['@id']} value={training['@id']}>{training.name}</option>
              ))}
            </select>
          </label>

          <label className="wp-training-history-filter">
            <span>Statut</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as HistoryFilterState['status'] }))}>
              <option value="all">Tous les statuts</option>
              <option value="solved">Réussi</option>
              <option value="failed">Raté</option>
            </select>
          </label>

          <label className="wp-training-history-filter">
            <span>Période</span>
            <select value={String(filters.periodDays)} onChange={(event) => setFilters((current) => ({ ...current, periodDays: event.target.value === 'all' ? 'all' : Number(event.target.value) }))}>
              {PERIOD_OPTIONS.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
              ))}
            </select>
          </label>

          <button className="wp-training-history-reset" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>
            <RotateCcw size={16} />
            Réinitialiser
          </button>
        </div>

        {activeChips.length > 0 ? (
          <div className="wp-training-history-chips" aria-label="Filtres actifs">
            {activeChips.map((chip) => <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />)}
          </div>
        ) : null}
      </div>

      <div className="wp-training-history-meta">
        <span>{filteredItems.length} activité{filteredItems.length > 1 ? 's' : ''}</span>
      </div>

      {isLoading ? <div className="wp-training-history-state">Chargement de l'historique...</div> : null}
      {isError ? <div className="wp-training-history-state is-error">{errorMessage ?? "Impossible de charger l'historique."}</div> : null}
      {!isLoading && !isError && pageItems.length === 0 ? (
        <div className="wp-training-history-state">{buildEmptyMessage(filters, supportsConnectionHistory)}</div>
      ) : null}

      {!isLoading && !isError && pageItems.length > 0 ? (
        <>
          <div className="wp-training-history-table-wrap">
            <table className="wp-training-history-table">
              <thead>
                <tr>
                  {authOnlyView ? (
                    <>
                      <th>Activité</th>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Détail</th>
                    </>
                  ) : (
                    <>
                      <th>Entraînement</th>
                      <th>Cycle</th>
                      <th>Activité</th>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Statut</th>
                      <th>Durée</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => authOnlyView ? (
                  <tr key={item['@id']}>
                    <td>{item.label}</td>
                    <td>{formatDesktopDate(item.occurredAt)}</td>
                    <td>{formatDesktopTime(item.occurredAt)}</td>
                    <td>{item.detail || '—'}</td>
                  </tr>
                ) : (
                  <tr key={item['@id']}>
                    <td>
                      {item.training ? (
                        <span className="wp-training-history-training-cell">
                          <TrainingLogoBadge size="sm" training={item.training} />
                          <span>{item.training.name}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td>{item.cycle ? `Cycle ${item.cycle.number}` : '—'}</td>
                    <td>
                      <div className="wp-training-history-activity-cell">
                        <strong>{item.label}</strong>
                        {item.attemptNumber ? <span>Essai {item.attemptNumber}</span> : item.detail ? <span>{item.detail}</span> : null}
                      </div>
                    </td>
                    <td>{formatDesktopDate(item.occurredAt)}</td>
                    <td>{formatDesktopTime(item.occurredAt)}</td>
                    <td>{item.status ? <HistoryStatusBadge status={item.status} statusLabel={item.statusLabel} /> : '—'}</td>
                    <td>{isAttemptItem(item) ? formatDuration(item.durationMilliseconds) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="wp-training-history-cards">
            {pageItems.map((item) => isAttemptItem(item) ? (
              <article className="wp-training-history-card wp-training-history-card--attempt" key={`${item['@id']}-card`}>
                <div className="wp-training-history-card__attempt-grid">
                  <div className="wp-training-history-card__icon-wrap">
                    {item.training ? <TrainingLogoBadge size="sm" training={item.training} /> : null}
                  </div>
                  <div className="wp-training-history-card__title-wrap">
                    <strong>{item.training?.name ?? 'Entraînement'}</strong>
                  </div>
                  <div className="wp-training-history-card__meta-line">
                    <span>{item.cycle ? `Cycle ${item.cycle.number}` : 'Sans cycle'}</span>
                    <span>{item.label}</span>
                    <span>{item.attemptNumber ? `Essai ${item.attemptNumber}` : 'Essai —'}</span>
                  </div>
                  <div className="wp-training-history-card__badge-line">
                    <HistoryStatusBadge status={item.status} statusLabel={item.statusLabel} />
                  </div>
                  <div className="wp-training-history-card__footer-line">
                    <span><CalendarDays size={14} />{formatCompactDateTime(item.occurredAt)}</span>
                    <span className="wp-training-history-card__footer-separator">|</span>
                    <span><Clock3 size={14} />{formatDuration(item.durationMilliseconds)}</span>
                  </div>
                </div>
              </article>
            ) : (
              <article className="wp-training-history-card wp-training-history-card--auth" key={`${item['@id']}-card`}>
                <strong className="wp-training-history-card__auth-title">{item.label}</strong>
                <div className="wp-training-history-card__auth-datetime">
                  <span>{formatDesktopDate(item.occurredAt)}</span>
                  <span>{formatDesktopTime(item.occurredAt)}</span>
                </div>
                {item.detail ? <p className="wp-training-history-card__auth-detail">{item.detail}</p> : null}
              </article>
            ))}
          </div>

          <div className="wp-training-history-pagination">
            <div className="wp-training-history-pagination__controls">
              <button disabled={currentPage === 1} type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft size={16} />Précédent
              </button>
              <div className="wp-training-history-pagination__pages">
                {pageNumbers.map((pageNumber) => pageNumber === 'ellipsis-left' || pageNumber === 'ellipsis-right' ? (
                  <span key={pageNumber} className="wp-training-history-pagination__ellipsis">…</span>
                ) : (
                  <button
                    key={pageNumber}
                    className={pageNumber === currentPage ? 'is-active' : undefined}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                Suivant<ChevronRight size={16} />
              </button>
            </div>
            <label className="wp-training-history-page-size">
              <select aria-label="Éléments par page" value={String(filters.pageSize)} onChange={(event) => setFilters((current) => ({ ...current, pageSize: Number(event.target.value) }))}>
                {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <small>éléments par page</small>
            </label>
          </div>
        </>
      ) : null}
    </div>
  );
}

export { TrainingsHistoryView };
export default TrainingsHistoryView;



