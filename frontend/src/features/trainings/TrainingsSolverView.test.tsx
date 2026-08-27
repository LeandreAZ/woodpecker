import type { ComponentProps } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SolverView } from './TrainingsSolverView';
import type { CyclePuzzle, CycleStats, Puzzle, Training, TrainingPuzzle, TrainingSummary } from './trainingsTypes';

vi.mock('./PuzzleSolver', () => ({
  PuzzleSolver: ({
    onCompleted,
    onFailed,
    onFirstMistake,
    onStateChange,
  }: {
    onCompleted?: (result: { mistakesCount: number; playedMoves: string[] }) => void;
    onFailed?: (result: { mistakesCount: number; playedMoves: string[] }) => void;
    onFirstMistake?: () => void;
    onStateChange?: (snapshot: { completed: boolean; evaluationFailed: boolean; feedback: { kind: 'info' | 'success' | 'error'; message: string }; mistakesCount: number; playedMoves: string[]; resolved: boolean }) => void;
  }) => (
    <div data-testid="puzzle-solver">
      <button
        type="button"
        onClick={() => {
          onStateChange?.({
            completed: false,
            evaluationFailed: true,
            feedback: { kind: 'error', message: 'Puzzle raté. Continuez à chercher mais les tentatives seront encore enregistrées.' },
            mistakesCount: 0,
            playedMoves: [],
            resolved: false,
          });
          onFirstMistake?.();
        }}
      >
        Premiere erreur
      </button>
      <button
        type="button"
        onClick={() => onCompleted?.({ mistakesCount: 0, playedMoves: ['e2e4'] })}
      >
        Completer
      </button>
      <button
        type="button"
        onClick={() => onFailed?.({ mistakesCount: 1, playedMoves: ['e2e4'] })}
      >
        Echouer
      </button>
    </div>
  ),
}));

const training: Training = {
  '@id': '/api/trainings/1',
  createdAt: '2026-08-06T18:10:00+00:00',
  description: 'Set tactique exigeant',
  icon: 'queen',
  iconBackgroundColor: '#7C5CFF',
  iconColor: '#FFFFFF',
  id: 1,
  mistakeLimit: 3,
  name: 'Mate en 2',
  status: 'draft',
};

const selectedPuzzle: Puzzle = {
  '@id': '/api/puzzles/9',
  fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
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
  failed: 0,
  pending: 1,
  progressPercent: 50,
  solved: 1,
  total: 2,
};

const currentCycle = {
  '@id': '/api/cycles/1',
  completedAt: '2026-08-10T09:00:00+00:00',
  id: 1,
  number: 1,
  startedAt: '2026-08-03T09:00:00+00:00',
  status: 'active',
  training: training['@id'],
} as const;

const summary: TrainingSummary = {
  attemptCount: 3,
  averageMistakes: 1,
  cycleSummaries: [
    {
      attemptCount: 3,
      cycle: currentCycle,
      failed: 0,
      pending: 1,
      progressPercent: 50,
      solved: 1,
      total: 2,
    },
  ],
  latestAttempts: [],
  latestCycleSummary: {
    attemptCount: 3,
    cycle: currentCycle,
    failed: 0,
    pending: 1,
    progressPercent: 50,
    solved: 1,
    total: 2,
  },
  notedPuzzleCount: 0,
  puzzleCount: 2,
  ratedPuzzleCount: 1,
  solvedAttemptCount: 1,
  themedPuzzleCount: 1,
};

const pendingCyclePuzzle: CyclePuzzle = {
  '@id': '/api/cycle_puzzles/1',
  activeAttempt: null,
  attemptCount: 0,
  completedAttemptCount: 0,
  cycle: '/api/cycles/1',
  durationMilliseconds: 0,
  id: 1,
  position: 0,
  status: 'pending',
  trainingPuzzle: selectedTrainingPuzzle['@id'],
};

function renderSolver(overrides: Partial<ComponentProps<typeof SolverView>> = {}) {
  const props: ComponentProps<typeof SolverView> = {
    activeTrainingSessionIri: '/api/training_sessions/1',
    attemptIsError: false,
    attemptIsPending: false,
    currentCycle,
    cycleIsFinished: false,
    cyclePuzzles: [pendingCyclePuzzle],
    cycleStats: baseCycleStats,
    currentCyclePuzzle: pendingCyclePuzzle,
    failedCyclePuzzleIris: new Set(),
    hasActiveCycle: true,
    onBackToDashboard: vi.fn(),
    onBackToDetail: vi.fn(),
    onPuzzleCompleted: vi.fn(),
    onPuzzleFailed: vi.fn(),
    onPuzzleFirstMistake: vi.fn(),
    onPuzzleProgress: vi.fn().mockResolvedValue(undefined),
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

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('SolverView', () => {
  it('propose un retour au tableau de bord quand aucun training n est ouvert', () => {
    const onBackToDashboard = vi.fn();

    renderSolver({
      cyclePuzzles: [],
      cycleStats: { failed: 0, pending: 0, progressPercent: 0, solved: 0, total: 1 },
      currentCyclePuzzle: null,
      hasActiveCycle: false,
      onBackToDashboard,
      selectedPuzzle: undefined,
      selectedTraining: null,
      selectedTrainingPuzzle: null,
      summary: null,
      trainingPuzzles: [],
    });

    expect(screen.getByText('Aucun entraînement ouvert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le tableau de bord' }));
    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });

  it('affiche un retour au detail quand le training ne contient encore aucun puzzle', () => {
    const onBackToDetail = vi.fn();

    renderSolver({
      onBackToDetail,
      selectedPuzzle: undefined,
      selectedTrainingPuzzle: null,
      trainingPuzzles: [],
    });

    expect(screen.getByText('Ce training ne contient pas encore de puzzle')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retour au détail du training' }));
    expect(onBackToDetail).toHaveBeenCalledTimes(1);
  });

  it('affiche les elements clefs du cycle et du puzzle courant', () => {
    renderSolver();

    expect(screen.getByText('Cycle 1')).toBeInTheDocument();
    expect(screen.getByText('Progression du cycle')).toBeInTheDocument();
    expect(screen.getAllByText('1 / 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Puzzle 1 / 2').length).toBeGreaterThan(0);
    expect(screen.getByText('À vous de jouer')).toBeInTheDocument();
  });

  it('propage le premier echec et permet de passer au puzzle suivant', async () => {
    const onPuzzleFirstMistake = vi.fn();
    const onPuzzleSelect = vi.fn();

    renderSolver({
      onPuzzleFirstMistake,
      onPuzzleSelect,
    });

    const nextButton = screen.getByRole('button', { name: /Suivant/ });
    expect(nextButton).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Premiere erreur' }));

    expect(onPuzzleFirstMistake).toHaveBeenCalledTimes(1);

    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(onPuzzleSelect).toHaveBeenCalledWith('/api/training_puzzles/2');
    });
  });

  it('transmet le payload de reussite avec les donnees de tentative actives', () => {
    const onPuzzleCompleted = vi.fn();

    renderSolver({ onPuzzleCompleted });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Completer' }));
    });

    expect(onPuzzleCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptNumber: 1,
        clientRequestId: expect.any(String),
        cyclePuzzle: pendingCyclePuzzle,
        durationMilliseconds: expect.any(Number),
        cyclePuzzleDurationMilliseconds: expect.any(Number),
        mistakesCount: 0,
        playedMoves: ['e2e4'],
        trainingSession: '/api/training_sessions/1',
      }),
    );
  });

  it('transmet le payload d echec avec les donnees de tentative actives', () => {
    const onPuzzleFailed = vi.fn();

    renderSolver({ onPuzzleFailed });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Echouer' }));
    });

    expect(onPuzzleFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptNumber: 1,
        clientRequestId: expect.any(String),
        cyclePuzzle: pendingCyclePuzzle,
        durationMilliseconds: expect.any(Number),
        cyclePuzzleDurationMilliseconds: expect.any(Number),
        mistakesCount: 1,
        playedMoves: ['e2e4'],
        trainingSession: '/api/training_sessions/1',
      }),
    );
  });

  it('declenche l autosave initial puis celui des 10 secondes sans recréer la boucle a chaque tick', async () => {
    vi.useFakeTimers();
    const onPuzzleProgress = vi.fn().mockResolvedValue(undefined);

    renderSolver({ onPuzzleProgress });

    await act(async () => {
      await Promise.resolve();
    });
    expect(onPuzzleProgress).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(onPuzzleProgress).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(onPuzzleProgress).toHaveBeenCalledTimes(2);
  });

  it('la navigation entre puzzles ne bloque plus sur une requete reseau en cours', () => {
    const onPuzzleProgress = vi.fn(() => new Promise(() => {}));
    const onPuzzleSelect = vi.fn();

    renderSolver({ onPuzzleProgress, onPuzzleSelect });

    fireEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    expect(onPuzzleSelect).toHaveBeenCalledWith('/api/training_puzzles/2');
  });
});
