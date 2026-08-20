import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UseMutationResult } from '@tanstack/react-query';
import { DetailView } from './TrainingsDetailView';
import type { CycleStats, Training, TrainingAnalytics, TrainingPuzzle, TrainingSummary } from './trainingsTypes';

const training: Training = {
  '@id': '/api/trainings/1',
  createdAt: '2026-08-06T18:10:00+00:00',
  description: 'Entraînement de mat en 2 coups',
  icon: 'queen',
  id: 1,
  mistakeLimit: 3,
  name: 'Mate en 2',
  status: 'draft',
};

const trainingPuzzle: TrainingPuzzle = {
  '@id': '/api/training_puzzles/1',
  id: 1,
  personalNote: 'Attention au theme',
  position: 0,
  puzzle: {
    '@id': '/api/puzzles/9',
    id: 9,
    rating: 1500,
    solution: ['e2e4'],
    themes: ['fork'],
  },
  training: training['@id'],
};

const cycleStats: CycleStats = {
  failed: 18,
  pending: 16,
  progressPercent: 72,
  solved: 86,
  total: 120,
};

const summaryStarted: TrainingSummary = {
  attemptCount: 256,
  averageMistakes: 2.1,
  cycleSummaries: [
    {
      attemptCount: 120,
      cycle: {
        '@id': '/api/cycles/1',
        completedAt: null,
        id: 1,
        number: 1,
        startedAt: '2026-08-12T09:00:00+00:00',
        status: 'active',
        training: training['@id'],
      },
      failed: 18,
      pending: 16,
      progressPercent: 72,
      solved: 86,
      total: 120,
    },
  ],
  latestAttempts: [
    {
      '@id': '/api/attempts/1',
      attemptedAt: '2026-08-12T09:10:00+00:00',
      cycleNumber: 1,
      durationMilliseconds: 12000,
      id: 1,
      mistakesCount: 1,
      successful: true,
      trainingPuzzlePosition: 0,
    },
  ],
  latestCycleSummary: {
    attemptCount: 120,
    cycle: {
      '@id': '/api/cycles/1',
      completedAt: null,
      id: 1,
      number: 1,
      startedAt: '2026-08-12T09:00:00+00:00',
      status: 'active',
      training: training['@id'],
    },
    failed: 18,
    pending: 16,
    progressPercent: 72,
    solved: 86,
    total: 120,
  },
  notedPuzzleCount: 1,
  puzzleCount: 120,
  ratedPuzzleCount: 1,
  solvedAttemptCount: 86,
  themedPuzzleCount: 1,
};

const analytics: TrainingAnalytics = {
  cycleTimeline: [summaryStarted.latestCycleSummary],
  performance: {
    attemptCount: 256,
    averageDurationSeconds: 17,
    averageMistakes: 2.1,
    failedAttemptCount: 18,
    latestAttemptedAt: '2026-08-12T09:10:00+00:00',
    solvedAttemptCount: 86,
    successRate: 72,
  },
  progressionSnapshot: {
    activeCycleCount: 1,
    bestCycleProgressPercent: 72,
    completedCycleCount: 0,
    latestCycleProgressPercent: 72,
    resumableCycle: true,
  },
  puzzleReadiness: {
    notedPuzzleCount: 1,
    puzzleCount: 120,
    ratedPuzzleCount: 1,
    themedPuzzleCount: 1,
  },
  training,
};

function createMutationMock(): UseMutationResult<TrainingPuzzle, Error, void, unknown> {
  return {
    error: null,
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  } as unknown as UseMutationResult<TrainingPuzzle, Error, void, unknown>;
}

function renderDetailView(overrides: Partial<ComponentProps<typeof DetailView>> = {}) {
  const props: ComponentProps<typeof DetailView> = {
    analytics: null,
    analyticsIsError: false,
    analyticsIsLoading: false,
    createPuzzleMutation: createMutationMock(),
    cycleStats,
    cycleStatusLabel: 'Aucun',
    deletePuzzleIsError: false,
    deletePuzzleIsPending: false,
    fen: '',
    hasResumableCycle: false,
    movePuzzleIsError: false,
    movePuzzleIsPending: false,
    onBackToDashboard: vi.fn(),
    onFenChange: vi.fn(),
    onImport: vi.fn(),
    onOpenSolver: vi.fn(),
    onPersonalNoteChange: vi.fn(),
    onPuzzleDelete: vi.fn(),
    onPuzzleMove: vi.fn(),
    onPuzzleSelect: vi.fn(),
    onRatingChange: vi.fn(),
    onSolutionTextChange: vi.fn(),
    onStartCycle: vi.fn(),
    onThemesTextChange: vi.fn(),
    personalNote: '',
    puzzleCount: 1,
    puzzleListIsLocked: false,
    rating: '',
    selectedTraining: training,
    solutionText: '',
    startCycleIsError: false,
    startCycleIsPending: false,
    summary: null,
    summaryIsError: false,
    summaryIsLoading: false,
    themesText: '',
    trainingPuzzles: [trainingPuzzle],
    trainingPuzzlesIsError: false,
    trainingPuzzlesIsLoading: false,
    ...overrides,
  };

  return render(<DetailView {...props} />);
}

describe('DetailView', () => {
  it('propose un retour au tableau de bord si aucun training n est selectionne', () => {
    const onBackToDashboard = vi.fn();

    renderDetailView({
      onBackToDashboard,
      selectedTraining: null,
      trainingPuzzles: [],
      puzzleCount: 0,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retour au tableau de bord' }));

    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });

  it('affiche l etat pre-cycle avec le bouton demarrer et la tolerance des erreurs', () => {
    const onStartCycle = vi.fn();
    const onImport = vi.fn();

    renderDetailView({
      onImport,
      onStartCycle,
      puzzleListIsLocked: false,
      summary: null,
      hasResumableCycle: false,
    });

    expect(screen.getByRole('button', { name: 'Démarrer le cycle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter des puzzles' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tolérance des erreurs' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Statut du cycle' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Collection de problèmes' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Historique des cycles' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dernières tentatives' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Démarrer le cycle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter des puzzles' }));

    expect(onStartCycle).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('affiche l etat cycle demarre avec le solveur, le statut du cycle et les sections laterales', () => {
    const onOpenSolver = vi.fn();

    renderDetailView({
      analytics,
      cycleStatusLabel: 'Actif',
      hasResumableCycle: true,
      onOpenSolver,
      puzzleCount: 120,
      puzzleListIsLocked: true,
      summary: summaryStarted,
    });

    expect(screen.getByRole('button', { name: 'Ouvrir le solveur' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Statut du cycle' })).toBeInTheDocument();
    expect(screen.getByText('Collection verrouillée')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Historique des cycles' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dernières tentatives' })).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le solveur' }));

    expect(onOpenSolver).toHaveBeenCalledTimes(1);
  });

  it('affiche les etats de chargement et les erreurs utiles sans masquer les sections', () => {
    renderDetailView({
      analyticsError: 'Analytics indisponibles.',
      analyticsIsError: true,
      analyticsIsLoading: true,
      startCycleError: 'Démarrage impossible.',
      startCycleIsError: true,
      summaryError: 'Résumé indisponible.',
      summaryIsError: true,
      summaryIsLoading: true,
      trainingPuzzlesError: 'Chargement des puzzles impossible.',
      trainingPuzzlesIsError: true,
      trainingPuzzlesIsLoading: true,
    });

    expect(screen.getByText('Chargement des analytics...')).toBeInTheDocument();
    expect(screen.getByText('Analytics indisponibles.')).toBeInTheDocument();
    expect(screen.getByText('Chargement des problèmes...')).toBeInTheDocument();
    expect(screen.getByText('Chargement des cycles...')).toBeInTheDocument();
    expect(screen.getByText('Chargement des tentatives...')).toBeInTheDocument();
    expect(screen.getByText('Démarrage impossible.')).toBeInTheDocument();
    expect(screen.getByText('Chargement des puzzles impossible.')).toBeInTheDocument();
    expect(screen.getAllByText('Résumé indisponible.').length).toBe(2);
  });
});
