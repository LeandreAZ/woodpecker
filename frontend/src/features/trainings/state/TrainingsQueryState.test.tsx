import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { TrainingsQueryState } from './TrainingsQueryState';
import { ApiError } from '../../../shared/api/client';
type State = ComponentProps<typeof TrainingsQueryState>['state'];
const query = () => ({ data: {}, refetch: vi.fn(), isLoading: false, isError: false, isFetching: false });
describe('TrainingsQueryState', () => {
  it('relance uniquement la requête concernée', () => {
    const stats = { ...query(), isError: true, error: new ApiError('Erreur', 500) }; const summary = query();
    const state = { activeView: 'stats', statsOverviewQuery: stats, trainingSummaryQuery: summary } as unknown as State;
    render(<TrainingsQueryState state={state} onBack={vi.fn()}>Contenu</TrainingsQueryState>);
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(stats.refetch).toHaveBeenCalledOnce(); expect(summary.refetch).not.toHaveBeenCalled();
  });
  it('garde les données visibles pendant une actualisation', () => {
    const state = { activeView: 'settings', userSettingsOverviewQuery: { ...query(), isFetching: true } } as unknown as State;
    render(<TrainingsQueryState state={state} onBack={vi.fn()}>Profil visible</TrainingsQueryState>);
    expect(screen.getByText('Profil visible')).toBeInTheDocument(); expect(screen.queryByLabelText('Chargement de la page')).not.toBeInTheDocument();
  });
  it('affiche le skeleton du formulaire pendant le chargement initial', () => {
    const state = { activeView: 'settings', userSettingsOverviewQuery: { ...query(), data: undefined, isLoading: true } } as unknown as State;
    render(<TrainingsQueryState state={state} onBack={vi.fn()}>Profil</TrainingsQueryState>);
    expect(screen.getByLabelText('Chargement de la page')).toHaveClass('ui-page-skeleton--settings');
    expect(screen.queryByText('Profil')).not.toBeInTheDocument();
  });
});
