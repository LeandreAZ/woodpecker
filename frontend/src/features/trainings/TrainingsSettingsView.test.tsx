import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrainingsSettingsView from './TrainingsSettingsView';
import type { UserSettingsOverview } from './trainingsTypes';

const settingsOverview: UserSettingsOverview = {
  user: {
    '@id': '/api/users/1',
    id: 1,
    email: 'owner@example.com',
    roles: ['ROLE_USER'],
    createdAt: '2026-08-29T01:00:48+02:00',
  },
  profile: {
    displayName: 'Leandre Ribeiro',
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
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <TrainingsSettingsView
        isError={false}
        isLoading={false}
        isSaving={false}
        onSave={onSave}
        settingsOverview={settingsOverview}
      />,
    );

    const displayNameInput = screen.getByDisplayValue('Leandre Ribeiro');
    fireEvent.change(displayNameInput, { target: { value: 'Lea Ribeiro' } });
    fireEvent.click(screen.getByRole('button', { name: /Clair/i }));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    const saveButton = screen.getByRole('button', { name: /Enregistrer les modifications/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        profile: { displayName: 'Lea Ribeiro' },
        appearance: { language: 'fr', theme: 'light' },
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
    expect(screen.getByText('Compte et sécurité')).toBeInTheDocument();
    expect(screen.queryByText('PARAMÈTRES')).not.toBeInTheDocument();
  });
});

