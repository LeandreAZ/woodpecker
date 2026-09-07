import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrainingsSettingsView from './SettingsView';
import type { UserSettingsOverview } from '../types/settings.types';

const LONG_EMAIL = 'uneadresseemailbeaucouppluslonguequelemplacementdisponible@example.com';

const settingsOverview: UserSettingsOverview = {
  user: {
    '@id': '/api/users/1',
    id: 1,
    email: LONG_EMAIL,
    roles: ['ROLE_USER'],
    createdAt: '2026-08-29T01:00:48+02:00',
  },
  profile: {
    pseudonym: 'Leandre Ribeiro',
    avatarUrl: null,
  },
  appearance: {
    language: 'fr',
    theme: 'dark',
  },
  board: {
    lightSquareColor: '#EEEED2',
    darkSquareColor: '#769656',
    themeLabel: 'Vert classique',
  },
  solverPreferences: {
    showLegalMoves: true,
    showCoordinates: true,
    animateMoves: true,
    showRightClickTargets: true,
  },
  security: {
    lastLoginAt: '2026-08-29T01:00:48+02:00',
    lastLogoutAt: null,
    lastLogoutReason: null,
  },
  workspace: {
    trainingCount: 0,
    activeTrainingCount: 0,
    archivedTrainingCount: 0,
    puzzleCount: 0,
    latestTrainingName: null,
  },
};

describe('TrainingsSettingsView', () => {
  it('renders persisted settings and submits an updated payload', async () => {
    const onSave = vi.fn().mockResolvedValue({
      ...settingsOverview,
      profile: { ...settingsOverview.profile, pseudonym: 'Lea Ribeiro' },
      solverPreferences: {
        ...settingsOverview.solverPreferences,
        showCoordinates: false,
      },
    });

    render(
      <TrainingsSettingsView
        isError={false}
        isLoading={false}
        isSaving={false}
        onSave={onSave}
        settingsOverview={settingsOverview}
      />,
    );

    const pseudonymInput = screen.getByDisplayValue('Leandre Ribeiro');
    fireEvent.change(pseudonymInput, { target: { value: 'Lea Ribeiro' } });
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer les modifications/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        profile: { pseudonym: 'Lea Ribeiro' },
        appearance: { language: 'fr', theme: 'dark' },
        board: { lightSquareColor: '#EEEED2', darkSquareColor: '#769656' },
        solverPreferences: {
          showLegalMoves: true,
          showCoordinates: false,
          animateMoves: true,
          showRightClickTargets: true,
        },
      });
    });

    expect(screen.getByRole('heading', { name: 'Paramètres' })).toBeInTheDocument();
    expect(screen.getByText('Pseudonyme')).toBeInTheDocument();
    expect(screen.getByText('Suppression du compte')).toBeInTheDocument();
    expect(screen.queryByText('Compte et sécurité')).not.toBeInTheDocument();
    expect(screen.queryByText('PARAMÈTRES')).not.toBeInTheDocument();
    expect(screen.getAllByTitle(LONG_EMAIL).length).toBeGreaterThan(0);
  });
});


it('preserves an unsaved profile on refresh and hydrates a different user', () => {
  const view = (overview: UserSettingsOverview) => <TrainingsSettingsView isError={false} isLoading={false} isSaving={false} onSave={vi.fn()} settingsOverview={overview} />;
  const { rerender } = render(view(settingsOverview));
  fireEvent.change(screen.getByDisplayValue('Leandre Ribeiro'), { target: { value: 'Draft intact' } });
  rerender(view({ ...settingsOverview, profile: { ...settingsOverview.profile, pseudonym: 'Server update' } }));
  expect(screen.getByDisplayValue('Draft intact')).toBeInTheDocument();
  rerender(view({ ...settingsOverview, user: { ...settingsOverview.user, id: 2 }, profile: { ...settingsOverview.profile, pseudonym: 'Other user' } }));
  expect(screen.getByDisplayValue('Other user')).toBeInTheDocument();
  expect(screen.queryByDisplayValue('Draft intact')).not.toBeInTheDocument();
});
