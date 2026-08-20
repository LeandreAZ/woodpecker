import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SolverView } from './TrainingsSolverView';
import type { CyclePuzzle, CycleStats, Puzzle, Training, TrainingPuzzle, TrainingSummary } from './trainingsTypes';

vi.mock('./PuzzleSolver', () => ({
  PuzzleSolver: ({ onCompleted, onFailed }: { onCompleted?: (result: { durationMilliseconds: number; mistakesCount: number; playedMoves: string[] }) => void; onFailed?: (result: { durationMilliseconds: number; mistakesCount: number; playedMoves: string[] }) => void }) => (
    <div data-testid="puzzle-solver">
      <button type="button" onClick={() => onCompleted?.({ durationMilliseconds: 1000, mistakesCount: 0, playedMoves: ['e2e4'] })}>
        Completer
      </button>
      <button type="button" onClick={() => onFailed?.({ durationMilliseconds: 1000, mistakesCount: 3, playedMoves: ['e2e4'] })}>
        Echouer
      </button>
    </div>
  ),
}));

const training: Training = {
  '@id': '/api/trainings/1',
  createdAt: '2026-08-06T18:10:00+00:00',
  description: 'Set tactique exigeant',
  id: 1,
  mistakeLimit: 3,
  name: 'Mate en 2',
  status: 'draft',
};

const selectedPuzzle: Puzzle = {
  '@id': '/api/puzzles/9',
  id: 9,
  rating: 1600,
  solution: ['e2e4'],
  themes: ['fork', 'mate'],
};

const selectedTrainingPuzzle: TrainingPuzzle = {
  '@id': '/api/training_puzzles/1',
  id: 1,
  position: 0,
  puzzle: selectedPuzzle,
  training: training['@id'],
};

const secondTrainingPuzzle: TrainingPuzzle = {
  '@id': '/api/training_puzzles/2',
  id: 2,
  position: 1,
  puzzle: selectedPuzzle,
  training: training['@id'],
};

const baseCycleStats: CycleStats = {
  failed: 1,
  pending: 2,
  progressPercent: 33,
  solved: 1,
  total: 3,
};

const summary: TrainingSummary = {
  attemptCount: 3,
  averageMistakes: 1,
  cycleSummaries: [
    {
      attemptCount: 3,
      cycle: {
        '@id': '/api/cycles/1',
        completedAt: '2026-08-10T09:00:00+00:00',
        id: 1,
        number: 1,
        startedAt: '2026-08-03T09:00:00+00:00',
        status: 'active',
        training: training['@id'],
      },
      failed: 1,
      pending: 2,
      progressPercent: 33,
      solved: 1,
      total: 3,
    },
  ],
  latestAttempts: [],
  latestCycleSummary: {
    attemptCount: 3,
    cycle: {
      '@id': '/api/cycles/1',
      completedAt: '2026-08-10T09:00:00+00:00',
      id: 1,
      number: 1,
      startedAt: '2026-08-03T09:00:00+00:00',
      status: 'active',
      training: training['@id'],
    },
    failed: 1,
    pending: 2,
    progressPercent: 33,
    solved: 1,
    total: 3,
  },
  notedPuzzleCount: 0,
  puzzleCount: 2,
  ratedPuzzleCount: 1,
  solvedAttemptCount: 1,
  themedPuzzleCount: 1,
};

const activeCyclePuzzle: CyclePuzzle = {
  '@id': '/api/cycle_puzzles/1',
  cycle: '/api/cycles/1',
  id: 1,
  position: 0,
  status: 'failed',
  trainingPuzzle: selectedTrainingPuzzle['@id'],
};

function renderSolver(overrides: Partial<ComponentProps<typeof SolverView>> = {}) {
  const props: ComponentProps<typeof SolverView> = {
    attemptIsError: false,
    attemptIsPending: false,
    cycleIsFinished: false,
    cyclePuzzles: [],
    cycleStats: baseCycleStats,
    currentCyclePuzzle: null,
    failedCyclePuzzleIris: new Set(),
    hasActiveCycle: true,
    mistakeLimit: 3,
    mistakeLimitIsError: false,
    mistakeLimitIsPending: false,
    onBackToDashboard: vi.fn(),
    onBackToDetail: vi.fn(),
    onMistakeLimitChange: vi.fn(),
    onPuzzleCompleted: vi.fn(),
    onPuzzleFailed: vi.fn(),
    onPuzzleSelect: vi.fn(),
    savedCyclePuzzleIris: new Set(),
    selectedPuzzle,
    selectedTraining: training,
    selectedTrainingPuzzle,
    summary,
    trainingPuzzles: [selectedTrainingPuzzle, secondTrainingPuzzle],
    ...overrides,
  };

  return render(<SolverView {...props} />);
}

describe('SolverView', () => {
  it('propose un retour au tableau de bord quand aucun training n est ouvert', () => {
    const onBackToDashboard = vi.fn();

    renderSolver({
      onBackToDashboard,
      selectedTraining: null,
      selectedTrainingPuzzle: null,
      selectedPuzzle: undefined,
      summary: null,
      trainingPuzzles: [],
      cyclePuzzles: [],
      cycleStats: { ...baseCycleStats, failed: 0, pending: 0, solved: 0, total: 1, progressPercent: 0 },
      hasActiveCycle: false,
    });

    expect(screen.getByText('Aucun entraînement ouvert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le tableau de bord' }));
    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });

  it('affiche un retour au detail quand le training ne contient encore aucun puzzle', () => {
    const onBackToDetail = vi.fn();

    renderSolver({
      onBackToDetail,
      trainingPuzzles: [],
      selectedTrainingPuzzle: null,
      selectedPuzzle: undefined,
    });

    expect(screen.getByText('Ce training ne contient pas encore de puzzle')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retour au détail du training' }));
    expect(onBackToDetail).toHaveBeenCalledTimes(1);
  });

  it('affiche la barre du cycle et la progression du solveur', () => {
    renderSolver();

    expect(screen.getByText('Cycle 1')).toBeInTheDocument();
    expect(screen.getAllByText('33%').length).toBeGreaterThan(0);
    expect(screen.getByText('Progression')).toBeInTheDocument();
    expect(screen.getByText('Puzzle 1 / 2')).toBeInTheDocument();
  });

  it('met en avant un puzzle a revoir avec une alerte au dessus de l echiquier', () => {
    renderSolver({
      currentCyclePuzzle: activeCyclePuzzle,
      cyclePuzzles: [activeCyclePuzzle],
      failedCyclePuzzleIris: new Set(['/api/cycle_puzzles/1']),
    });

    expect(screen.getByText(/Ce puzzle est marqué à revoir/)).toBeInTheDocument();
    expect(screen.getByText('À revoir')).toBeInTheDocument();
  });

  it('transmet les callbacks de resolution et permet la navigation precedent suivant', () => {
    const onPuzzleCompleted = vi.fn();
    const onPuzzleFailed = vi.fn();
    const onPuzzleSelect = vi.fn();

    renderSolver({
      currentCyclePuzzle: { ...activeCyclePuzzle, status: 'pending' },
      cyclePuzzles: [{ ...activeCyclePuzzle, status: 'pending' }],
      onPuzzleCompleted,
      onPuzzleFailed,
      onPuzzleSelect,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Completer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Echouer' }));
    fireEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    expect(onPuzzleCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMilliseconds: 1000,
        mistakesCount: 0,
        playedMoves: ['e2e4'],
      }),
    );
    expect(onPuzzleFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMilliseconds: 1000,
        mistakesCount: 3,
        playedMoves: ['e2e4'],
      }),
    );
    expect(onPuzzleSelect).toHaveBeenCalledWith('/api/training_puzzles/2');
  });

  it('affiche les messages de sauvegarde et de cycle deja valide', () => {
    renderSolver({
      attemptError: 'Tentative impossible pour le moment.',
      attemptIsError: true,
      attemptIsPending: true,
      currentCyclePuzzle: { ...activeCyclePuzzle, status: 'solved' },
      cycleIsFinished: true,
      cyclePuzzles: [activeCyclePuzzle],
      savedCyclePuzzleIris: new Set(['/api/cycle_puzzles/1']),
    });

    expect(screen.getByText('Sauvegarde de la tentative...')).toBeInTheDocument();
    expect(screen.getByText('Tentative impossible pour le moment.')).toBeInTheDocument();
    expect(screen.getByText('Ce puzzle est déjà validé pour ce cycle.')).toBeInTheDocument();
  });
});
