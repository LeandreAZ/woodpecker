import {
  Search,
  X
} from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState, type SetStateAction } from 'react';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { HistoryFilters } from '../components/HistoryFilters';
import { HistoryPagination } from '../components/HistoryPagination';
import { HistoryTable } from '../components/HistoryTable';
import { HistoryTimeline } from '../components/HistoryTimeline';
import '../styles/history.css';
import type { HistoryFilterState, TrainingsHistoryViewProps } from '../types/historyView.types';
import { ACTIVITY_LABELS, buildEmptyMessage, buildPageNumbers, DEFAULT_FILTERS, filterByPeriod, getPeriodLabel, getStatusLabel, isAttemptItem, isAuthOnlyFilter } from '../utils/historyFilters';

function TrainingsHistoryView({ errorMessage, historyOverview, initialFilterPreset, isError, isLoading, onInitialFilterPresetApplied }: TrainingsHistoryViewProps) {
  const [filters, setFilterState] = useState<HistoryFilterState>(() => ({ ...DEFAULT_FILTERS, ...initialFilterPreset }));
  const [appliedPreset, setAppliedPreset] = useState(initialFilterPreset);
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(filters.search.trim().toLowerCase());

  function setFilters(value: SetStateAction<HistoryFilterState>) {
    setFilterState(value);
    setPage(1);
  }

  if (initialFilterPreset !== appliedPreset) {
    setAppliedPreset(initialFilterPreset);
    if (initialFilterPreset) {
      setFilterState((current) => ({ ...current, ...initialFilterPreset }));
      setPage(1);
    }
  }

  useEffect(() => {
    if (initialFilterPreset) onInitialFilterPresetApplied?.();
  }, [initialFilterPreset, onInitialFilterPresetApplied]);

  const items = useMemo(() => historyOverview?.items ?? [], [historyOverview]);
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
    filters.activity !== DEFAULT_FILTERS.activity && filters.activity !== 'all'
      ? { key: 'activity', label: ACTIVITY_LABELS[filters.activity], onRemove: () => setFilters((current) => ({ ...current, activity: DEFAULT_FILTERS.activity })) }
      : null,
    selectedTraining ? { key: 'training', label: selectedTraining.name, onRemove: () => setFilters((current) => ({ ...current, training: 'all' })) } : null,
    filters.status !== 'all' ? { key: 'status', label: getStatusLabel(filters.status), onRemove: () => setFilters((current) => ({ ...current, status: 'all' })) } : null,
    filters.periodDays !== DEFAULT_FILTERS.periodDays ? { key: 'period', label: getPeriodLabel(filters.periodDays), onRemove: () => setFilters((current) => ({ ...current, periodDays: DEFAULT_FILTERS.periodDays })) } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>;


  return (
    <div className="wp-page wp-training-history-page wp-training-history-page--v2">
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

      <HistoryFilters filters={filters} setFilters={setFilters} activityOptions={activityOptions} availableTrainings={availableTrainings} activeChips={activeChips} />


      {isLoading ? <div className="wp-training-history-state">Chargement de l'historique...</div> : null}
      {isError ? <div className="wp-training-history-state is-error">{errorMessage ?? "Impossible de charger l'historique."}</div> : null}
      {!isLoading && !isError && pageItems.length === 0 ? (
        <EmptyState title="Historique vide" description={buildEmptyMessage(filters, supportsConnectionHistory)} />
      ) : null}

      {!isLoading && !isError && pageItems.length > 0 ? (
        <>
          <HistoryTable pageItems={pageItems} authOnlyView={authOnlyView} />

          <HistoryTimeline pageItems={pageItems} />

          <HistoryPagination currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} setPage={setPage} />
        </>
      ) : null}
    </div>
  );
}

export { TrainingsHistoryView };

export default TrainingsHistoryView;
