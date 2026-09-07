import {
  RotateCcw,
  X
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { HistoryOverview } from '../types/history.types';
import type { HistoryFilterState } from '../types/historyView.types';
import { DEFAULT_FILTERS, PAGE_SIZE_OPTIONS, PERIOD_OPTIONS } from '../utils/historyFilters';

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button className="wp-training-history-chip" type="button" onClick={onRemove}>
      <span>{label}</span>
      <X size={14} />
    </button>
  );
}

export function HistoryFilters({ filters, setFilters, activityOptions, availableTrainings, activeChips }: { filters: HistoryFilterState; setFilters: Dispatch<SetStateAction<HistoryFilterState>>; activityOptions: Array<{ label: string; value: HistoryFilterState['activity'] }>; availableTrainings: HistoryOverview['availableTrainings']; activeChips: Array<{ key: string; label: string; onRemove: () => void }> }) {
  return (
    <div className="wp-training-history-filters-wrap">
      <div className="wp-training-history-filters wp-training-history-filters--v2">
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

        <label className="wp-training-history-filter wp-training-history-page-size wp-training-history-page-size--inline">
          <span>Éléments par page</span>
          <select aria-label="Éléments par page" value={String(filters.pageSize)} onChange={(event) => setFilters((current) => ({ ...current, pageSize: Number(event.target.value) }))}>
            {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
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
  );
}
