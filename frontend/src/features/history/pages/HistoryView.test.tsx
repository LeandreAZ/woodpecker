import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TrainingsHistoryView from './HistoryView';
import type { HistoryOverview } from '../types/history.types';

const training = {
  '@id': '/api/trainings/1',
  id: 1,
  name: 'Mat',
  description: 'Serie rapide',
  icon: 'queen',
  iconBackgroundColor: '#7C5CFF',
  iconColor: '#FFFFFF',
  logo: null,
  status: 'active',
};

const historyOverview: HistoryOverview = {
  availableTrainings: [training],
  items: [
    {
      '@id': '/api/authentication_events/2',
      id: 2,
      activityType: 'connection',
      training: null,
      cycle: null,
      cyclePuzzle: null,
      label: 'Connexion',
      detail: 'Windows · Chrome · Desktop',
      status: null,
      statusLabel: null,
      attemptNumber: null,
      durationMilliseconds: 0,
      occurredAt: '2026-08-28T11:40:00+02:00',
    },
    {
      '@id': '/api/attempts/1',
      id: 1,
      activityType: 'attempt',
      training,
      cycle: {
        '@id': '/api/cycles/2',
        id: 2,
        number: 2,
        status: 'completed',
      },
      cyclePuzzle: {
        '@id': '/api/cycle_puzzles/81',
        id: 81,
        position: 1,
        status: 'failed',
      },
      label: 'Puzzle #2',
      detail: 'Tentative réussie',
      status: 'solved',
      statusLabel: 'Réussi',
      attemptNumber: 1,
      durationMilliseconds: 314000,
      occurredAt: '2026-08-28T11:33:46+02:00',
    },
    {
      '@id': '/api/attempts/2',
      id: 2,
      activityType: 'attempt',
      training,
      cycle: {
        '@id': '/api/cycles/1',
        id: 1,
        number: 1,
        status: 'completed',
      },
      cyclePuzzle: {
        '@id': '/api/cycle_puzzles/82',
        id: 82,
        position: 0,
        status: 'failed',
      },
      label: 'Puzzle #1',
      detail: 'Tentative échouée',
      status: 'failed',
      statusLabel: 'Raté',
      attemptNumber: 2,
      durationMilliseconds: 117000,
      occurredAt: '2026-08-03T20:51:06+02:00',
    },
  ],
  latestOccurredAt: '2026-08-28T11:40:00+02:00',
  supportsConnectionHistory: true,
  totalItems: 3,
};

function buildPagedHistoryOverview(): HistoryOverview {
  const items: HistoryOverview['items'] = [
    {
      '@id': '/api/authentication_events/200',
      id: 200,
      activityType: 'connection' as const,
      training: null,
      cycle: null,
      cyclePuzzle: null,
      label: 'Connexion',
      detail: 'Windows · Chrome · Desktop',
      status: null,
      statusLabel: null,
      attemptNumber: null,
      durationMilliseconds: 0,
      occurredAt: '2026-08-29T12:00:00+02:00',
    },
  ];

  for (let index = 0; index < 27; index += 1) {
    items.push({
      '@id': `/api/attempts/${index + 10}`,
      id: index + 10,
      activityType: 'attempt',
      training,
      cycle: {
        '@id': '/api/cycles/4',
        id: 4,
        number: 4,
        status: 'completed',
      },
      cyclePuzzle: {
        '@id': `/api/cycle_puzzles/${index + 300}`,
        id: index + 300,
        position: index,
        status: index % 2 === 0 ? 'solved' : 'failed',
      },
      label: `Puzzle #${index + 1}`,
      detail: index % 2 === 0 ? 'Tentative réussie' : 'Tentative échouée',
      status: index % 2 === 0 ? 'solved' : 'failed',
      statusLabel: index % 2 === 0 ? 'Réussi' : 'Raté',
      attemptNumber: 1,
      durationMilliseconds: 60000 + index,
      occurredAt: `2026-08-${String(28 - Math.floor(index / 3)).padStart(2, '0')}T12:${String(index).padStart(2, '0')}:00+02:00`,
    });
  }

  return {
    availableTrainings: [training],
    items,
    latestOccurredAt: '2026-08-29T12:00:00+02:00',
    supportsConnectionHistory: true,
    totalItems: items.length,
  };
}

describe('TrainingsHistoryView', () => {
  it('shows attempts only by default and keeps auth events hidden on first load', () => {
    render(<TrainingsHistoryView historyOverview={historyOverview} isError={false} isLoading={false} />);

    const headings = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headings).toEqual(['Entraînement', 'Cycle', 'Activité', 'Date', 'Heure', 'Statut', 'Durée']);
    expect(screen.queryByText('Connexion')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Activité')).toHaveValue('attempt');
  });

  it('keeps pagination scoped to attempts on the default filter', () => {
    const pagedHistoryOverview = buildPagedHistoryOverview();
    const { container } = render(<TrainingsHistoryView historyOverview={pagedHistoryOverview} isError={false} isLoading={false} />);

    expect(container.querySelectorAll('tbody tr')).toHaveLength(25);
    expect(screen.queryByText('Connexion')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('shows auth history rows and switches to the dedicated auth-only table when filtered', () => {
    render(<TrainingsHistoryView historyOverview={historyOverview} isError={false} isLoading={false} />);

    fireEvent.change(screen.getByLabelText('Activité'), { target: { value: 'connection' } });

    const headings = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headings).toEqual(['Activité', 'Date', 'Heure', 'Détail']);
    expect(screen.getAllByText('Connexion').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Windows · Chrome · Desktop').length).toBeGreaterThan(0);
  });

  it('resets filters back to the attempt-only default state', () => {
    render(<TrainingsHistoryView historyOverview={historyOverview} isError={false} isLoading={false} />);

    fireEvent.change(screen.getByLabelText('Activité'), { target: { value: 'all' } });
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'failed' } });
    fireEvent.click(screen.getByRole('button', { name: /Réinitialiser/i }));

    expect(screen.getByLabelText('Activité')).toHaveValue('attempt');
    expect(screen.getByLabelText('Statut')).toHaveValue('all');
    expect(screen.queryByText('Connexion')).not.toBeInTheDocument();
  });

  it('shows active filter chips and removes them individually back to their defaults', () => {
    render(<TrainingsHistoryView historyOverview={historyOverview} isError={false} isLoading={false} />);

    fireEvent.change(screen.getByLabelText('Activité'), { target: { value: 'connection' } });
    expect(screen.getByRole('button', { name: /Connexions/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Connexions/i }));
    expect(screen.getByLabelText('Activité')).toHaveValue('attempt');
    expect(screen.queryByText('Connexion')).not.toBeInTheDocument();
  });

  it('keeps the page-size control in the filter row and exposes the tighter mobile card structure', () => {
    const { container } = render(<TrainingsHistoryView historyOverview={historyOverview} isError={false} isLoading={false} />);

    expect(screen.getByLabelText('Éléments par page')).toBeInTheDocument();
    expect(container.querySelector('.wp-training-history-filters--v2 .wp-training-history-page-size--inline')).toBeTruthy();
    expect(container.querySelector('.wp-training-history-card__heading--v2')).toBeTruthy();
    expect(container.querySelector('.wp-training-history-card__meta-line--v2')).toBeTruthy();
    expect(container.querySelector('.wp-training-history-card__footer-line--v2')).toBeTruthy();
    expect(container.querySelector('.wp-training-history-card__badge-line')).toBeFalsy();
  });
});

