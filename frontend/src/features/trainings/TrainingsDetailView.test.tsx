import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UseMutationResult } from '@tanstack/react-query';
import { DetailView } from './TrainingsDetailView';
import type {
  Cycle,
  CyclePuzzle,
  CycleStats,
  Training,
  TrainingAnalytics,
  TrainingPuzzle,
  TrainingSummary,
} from './trainingsTypes';

const training: Training = {
  '@id': '/api/trainings/1',
  createdAt: '2026-08-06T18:10:00+00:00',
  description: 'Test des mats',
  icon: 'queen',
  id: 1,
  mistakeLimit: 3,
  name: 'Mat',
  status: 'draft',
};

const trainingPuzzle: TrainingPuzzle = {
  '@id': '/api/training_puzzles/1',
  id: 1,
  personalNote: 'Attention au theme',
  position: 0,
  puzzle: {
    '@id': '/api/puzzles/9',
    fen: '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    id: 9,
    rating: 1500,
    solution: ['e2e4'],
    themes: ['fork'],
  },
  training: training['@id'],
};

const currentCycle: Cycle = {
  '@id': '/api/cycles/1',
  completedAt: null,
  id: 1,
  number: 1,
  startedAt: '2026-08-12T09:00:00+00:00',
  status: 'active',
  training: training['@id'],
};

const startedCyclePuzzles: CyclePuzzle[] = [
  {
    '@id': '/api/cycle_puzzles/1',
    cycle: currentCycle['@id'],
    id: 1,
    position: 0,
    status: 'solved',
    trainingPuzzle: trainingPuzzle['@id'],
  },
];

const cycleStatsIdle: CycleStats = {
  failed: 0,
  pending: 30,
  progressPercent: 0,
  solved: 0,
  total: 30,
};

const cycleStatsStarted: CycleStats = {
  failed: 3,
  pending: 9,
  progressPercent: 68,
  solved: 18,
  total: 30,
};

const summaryStarted: TrainingSummary = {
  attemptCount: 24,
  averageMistakes: 1.4,
  cycleSummaries: [
    {
      attemptCount: 24,
      averageAttempts: 1.4,
      cycle: currentCycle,
      failed: 3,
      pending: 9,
      progressPercent: 68,
      solved: 18,
      successRate: 75,
      total: 30,
    },
    {
      attemptCount: 20,
      averageAttempts: 1.2,
      cycle: {
        '@id': '/api/cycles/0',
        completedAt: '2026-08-03T09:00:00+00:00',
        id: 2,
        number: 0,
        startedAt: '2026-07-27T09:00:00+00:00',
        status: 'completed',
        training: training['@id'],
      },
      failed: 0,
      pending: 0,
      progressPercent: 56,
      solved: 30,
      successRate: 63,
      total: 30,
    },
  ],
  latestAttempts: [
    {
      '@id': '/api/attempts/1',
      attemptedAt: '2026-08-12T09:10:00+00:00',
      cycleNumber: 1,
      durationMilliseconds: 12000,
      id: 1,
      mistakesCount: 0,
      successful: true,
      trainingPuzzlePosition: 0,
    },
  ],
  latestCycleSummary: {
    attemptCount: 24,
    averageAttempts: 1.4,
    cycle: currentCycle,
    failed: 3,
    pending: 9,
    progressPercent: 68,
    solved: 18,
    successRate: 75,
    total: 30,
  },
  notedPuzzleCount: 1,
  puzzleCount: 30,
  ratedPuzzleCount: 1,
  solvedAttemptCount: 18,
  themedPuzzleCount: 1,
};

const analytics: TrainingAnalytics = {
  cycleTimeline: summaryStarted.cycleSummaries,
  performance: {
    attemptCount: 24,
    averageDurationSeconds: 17,
    averageMistakes: 1.4,
    failedAttemptCount: 3,
    latestAttemptedAt: '2026-08-12T09:10:00+00:00',
    solvedAttemptCount: 18,
    successRate: 75,
  },
  progressionSnapshot: {
    activeCycleCount: 1,
    bestCycleProgressPercent: 68,
    completedCycleCount: 1,
    latestCycleProgressPercent: 68,
    resumableCycle: true,
  },
  puzzleReadiness: {
    notedPuzzleCount: 1,
    puzzleCount: 30,
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
    currentCycle: null,
    cyclePuzzles: [],
    cycleStats: cycleStatsIdle,
    cycleStatusLabel: 'Aucun',
    deletePuzzleIsError: false,
    deletePuzzleIsPending: false,
    fen: '',
    hasResumableCycle: false,
    movePuzzleIsError: false,
    movePuzzleIsPending: false,
    onBackToDashboard: vi.fn(),
    onDeleteTraining: vi.fn(),
    deleteTrainingIsPending: false,
    onEditTraining: vi.fn(),
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
    onViewAllAttemptHistory: vi.fn(),
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

  it('affiche l etat cycle non demarre avec import, demarrage et sans solveur', () => {
    const onStartCycle = vi.fn();
    const onImport = vi.fn();

    renderDetailView({
      cycleStats: cycleStatsIdle,
      onImport,
      onStartCycle,
      puzzleCount: 30,
      summary: null,
      trainingPuzzles: [trainingPuzzle],
    });

    expect(screen.getByRole('button', { name: "Modifier l'entraînement" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importer des puzzles' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Démarrer le cycle' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ouvrir le solveur' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Collection de problèmes' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Statut du cycle' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Historique des cycles' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dernières tentatives' })).not.toBeInTheDocument();
    expect(screen.getByText("Aucun cycle n'a encore été démarré.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Démarrer le cycle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Importer des puzzles' }));

    expect(onStartCycle).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
  });


  it('n ouvre plus le solver depuis un simple historique sans cycle actif', () => {
    const onOpenSolver = vi.fn();
    const onPuzzleSelect = vi.fn();
    const completedCycle: Cycle = {
      ...currentCycle,
      '@id': '/api/cycles/9',
      completedAt: '2026-08-19T09:00:00+00:00',
      id: 9,
      number: 3,
      status: 'completed',
    };

    renderDetailView({
      analytics,
      currentCycle: null,
      cyclePuzzles: [],
      cycleStats: cycleStatsStarted,
      cycleStatusLabel: 'Terminé',
      hasResumableCycle: false,
      onOpenSolver,
      onPuzzleSelect,
      puzzleCount: 30,
      summary: {
        ...summaryStarted,
        latestCycleSummary: {
          attemptCount: 24,
          averageAttempts: 1.4,
          cycle: completedCycle,
          failed: 3,
          pending: 9,
          progressPercent: 68,
          solved: 18,
          successRate: 75,
          total: 30,
        },
        cycleSummaries: [
          {
            attemptCount: 24,
            averageAttempts: 1.4,
            cycle: completedCycle,
            failed: 3,
            pending: 9,
            progressPercent: 68,
            solved: 18,
            successRate: 75,
            total: 30,
          },
        ],
      },
    });

    expect(screen.queryByRole('button', { name: 'Ouvrir le solveur' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lancer le cycle suivant' })).toBeInTheDocument();
    expect(screen.getByText("Aucun cycle actif n'est disponible.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Accéder au problème 1'));

    expect(onOpenSolver).not.toHaveBeenCalled();
    expect(onPuzzleSelect).not.toHaveBeenCalled();
  });

  it('affiche le bouton du cycle suivant quand un cycle actif est complete a 100 pourcent', () => {
    const onStartCycle = vi.fn();

    renderDetailView({
      analytics,
      currentCycle,
      cyclePuzzles: startedCyclePuzzles,
      cycleStats: {
        failed: 5,
        pending: 0,
        progressPercent: 100,
        solved: 25,
        total: 30,
      },
      hasResumableCycle: false,
      onStartCycle,
      puzzleCount: 30,
      summary: {
        ...summaryStarted,
        latestCycleSummary: {
          ...summaryStarted.latestCycleSummary!,
          failed: 5,
          pending: 0,
          progressPercent: 100,
          solved: 25,
          successRate: 83,
        },
      },
    });

    expect(screen.getByRole('button', { name: 'Lancer le cycle suivant' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ouvrir le solveur' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lancer le cycle suivant' }));

    expect(onStartCycle).toHaveBeenCalledTimes(1);
  });

  it('ouvre l historique complet des cycles et redirige les dernieres tentatives vers history filtre', () => {
    const onViewAllAttemptHistory = vi.fn();

    renderDetailView({
      analytics,
      currentCycle,
      cyclePuzzles: startedCyclePuzzles,
      cycleStats: cycleStatsStarted,
      hasResumableCycle: true,
      onViewAllAttemptHistory,
      puzzleCount: 30,
      summary: summaryStarted,
    });

    const viewAllButtons = screen.getAllByRole('button', { name: 'Voir tout' });
    fireEvent.click(viewAllButtons[0]);
    expect(screen.getAllByRole('heading', { name: 'Historique des cycles' }).length).toBeGreaterThan(1);

    fireEvent.click(viewAllButtons[1]);
    expect(onViewAllAttemptHistory).toHaveBeenCalledTimes(1);
  });

  it('affiche l etat cycle demarre avec solveur, statut, historique et tentatives', () => {
    const onOpenSolver = vi.fn();

    renderDetailView({
      analytics,
      currentCycle,
      cyclePuzzles: startedCyclePuzzles,
      cycleStats: cycleStatsStarted,
      cycleStatusLabel: 'Actif',
      hasResumableCycle: true,
      onOpenSolver,
      puzzleCount: 30,
      puzzleListIsLocked: true,
      summary: summaryStarted,
    });

    expect(screen.getByRole('button', { name: "Modifier l'entraînement" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ouvrir le solveur' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Importer des puzzles' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Statut du cycle' })).toBeInTheDocument();
    expect(screen.getByText('Collection verrouillée')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Historique des cycles' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dernières tentatives' })).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('1,4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le solveur' }));

    expect(onOpenSolver).toHaveBeenCalledTimes(1);
  });

  it('affiche les etats de chargement et les erreurs utiles sans masquer la page', () => {
    renderDetailView({
      analyticsError: 'Analytics indisponibles.',
      analyticsIsError: true,
      analyticsIsLoading: true,
      currentCycle,
      cyclePuzzles: startedCyclePuzzles,
      cycleStats: cycleStatsStarted,
      hasResumableCycle: true,
      startCycleError: 'Démarrage impossible.',
      startCycleIsError: true,
      summary: summaryStarted,
      summaryError: 'Résumé indisponible.',
      summaryIsError: true,
      summaryIsLoading: true,
      trainingPuzzlesError: 'Chargement des puzzles impossible.',
      trainingPuzzlesIsError: true,
      trainingPuzzlesIsLoading: true,
    });

    expect(screen.getByText('Chargement des problèmes...')).toBeInTheDocument();
    expect(screen.getByText('Chargement du cycle...')).toBeInTheDocument();
    expect(screen.getByText('Chargement des statistiques détaillées...')).toBeInTheDocument();
    expect(screen.getByText('Analytics indisponibles.')).toBeInTheDocument();
    expect(screen.getByText('Démarrage impossible.')).toBeInTheDocument();
    expect(screen.getByText('Chargement des puzzles impossible.')).toBeInTheDocument();
    expect(screen.getByText('Résumé indisponible.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Collection de problèmes' })).toBeInTheDocument();
  });
});
