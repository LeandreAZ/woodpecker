import { useEffect, useState, type ComponentProps } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SolverView } from './SolverView';
import type { CyclePuzzle, CycleStats, Puzzle, Training, TrainingPuzzle, TrainingSummary } from '../../trainings/types/training.types';

vi.mock('../components/PuzzleSolver', () => ({
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
  }) => {
    const [snapshot, setSnapshot] = useState<{
      completed: boolean;
      evaluationFailed: boolean;
      feedback: { kind: 'info' | 'success' | 'error'; message: string };
      mistakesCount: number;
      playedMoves: string[];
      resolved: boolean;
    }>({
      completed: false,
      evaluationFailed: false,
      feedback: { kind: 'info', message: 'Trouvez le meilleur coup.' },
      mistakesCount: 0,
      playedMoves: [],
      resolved: false,
    });

    useEffect(() => {
      onStateChange?.(snapshot);
    }, [onStateChange, snapshot]);

    return (
      <div data-testid="puzzle-solver">
        <button
          type="button"
          onClick={() => {
            setSnapshot({
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
          onClick={() => {
            setSnapshot({
              completed: false,
              evaluationFailed: false,
              feedback: { kind: 'info', message: 'Bon coup. Trouvez la suite.' },
              mistakesCount: 0,
              playedMoves: ['e2e4'],
              resolved: false,
            });
          }}
        >
          Jouer coup
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
    );
  },
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

  return {
    props,
    ...render(<SolverView {...props} />),
  };
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

  it('affiche les elements clefs du cycle et passe visuellement en cours des l ouverture', async () => {
    renderSolver();

    expect(screen.getByText('Cycle 1')).toBeInTheDocument();
    expect(screen.getByText('Progression du cycle')).toBeInTheDocument();
    expect(screen.getAllByText('1 / 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Puzzle 1 / 2').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText('En cours')).toBeInTheDocument();
    });
  });

  it('garde un etat de preparation explicite quand la session active manque encore', () => {
    renderSolver({
      activeTrainingSessionIri: null,
      hasActiveCycle: false,
      isTrainingSessionPending: true,
    });

    expect(screen.getByText('Préparation de la session')).toBeInTheDocument();
    expect(screen.queryByTestId('puzzle-solver')).not.toBeInTheDocument();
  });

  it('bloque le solver quand un puzzle est affiche sans cycle actif reel et n envoie aucune mutation', async () => {
    const onPuzzleProgress = vi.fn().mockResolvedValue(undefined);

    renderSolver({
      activeTrainingSessionIri: null,
      currentCycle: null,
      currentCyclePuzzle: null,
      cyclePuzzles: [],
      hasActiveCycle: false,
      onPuzzleProgress,
    });

    expect(screen.getByText('Aucun cycle démarré')).toBeInTheDocument();
    expect(screen.queryByTestId('puzzle-solver')).not.toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
    });

    expect(onPuzzleProgress).not.toHaveBeenCalled();
  });

  it('n affiche pas En cours uniquement parce qu un puzzle pending est selectionne', () => {
    renderSolver();

    expect(screen.getAllByText('Non tenté').length).toBeGreaterThan(0);
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


  it('reste stable quand un coup met a jour le snapshot du solver reel', async () => {
    const onPuzzleProgress = vi.fn().mockResolvedValue(undefined);

    renderSolver({ onPuzzleProgress });

    await waitFor(() => {
      expect(screen.getByText('En cours')).toBeInTheDocument();
    });

    const initialCallCount = onPuzzleProgress.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Jouer coup' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('puzzle-solver')).toBeInTheDocument();
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(onPuzzleProgress.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount);
  });

  it('transmet le payload de reussite avec les donnees de tentative actives', async () => {
    const onPuzzleCompleted = vi.fn();

    renderSolver({ onPuzzleCompleted });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Completer' }));
      await Promise.resolve();
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

  it('transmet le payload d echec avec les donnees de tentative actives', async () => {
    const onPuzzleFailed = vi.fn();

    renderSolver({ onPuzzleFailed });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Echouer' }));
      await Promise.resolve();
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

  it('declenche l autosave initial puis celui des 10 secondes avec le meme clientRequestId et une duree croissante', async () => {
    vi.useFakeTimers();
    const onPuzzleProgress = vi.fn().mockResolvedValue(undefined);

    renderSolver({ onPuzzleProgress });

    await act(async () => {
      await Promise.resolve();
    });
    expect(onPuzzleProgress).toHaveBeenCalledTimes(1);

    const firstPayload = onPuzzleProgress.mock.calls[0][0];

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(onPuzzleProgress).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(onPuzzleProgress).toHaveBeenCalledTimes(2);

    const secondPayload = onPuzzleProgress.mock.calls[1][0];
    expect(secondPayload.clientRequestId).toBe(firstPayload.clientRequestId);
    expect(secondPayload.attemptNumber).toBe(firstPayload.attemptNumber);
    expect(secondPayload.durationMilliseconds).toBeGreaterThan(firstPayload.durationMilliseconds);
    expect(secondPayload.cyclePuzzleDurationMilliseconds).toBeGreaterThan(firstPayload.cyclePuzzleDurationMilliseconds);
  });

  it('redemarre automatiquement une nouvelle tentative quand le meme puzzle passe de pending a failed', async () => {
    vi.useFakeTimers();
    let finishSave!: () => void;
    const onPuzzleFailed = vi.fn().mockImplementationOnce(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    const onPuzzleProgress = vi.fn().mockResolvedValue(undefined);

    const view = renderSolver({ onPuzzleFailed, onPuzzleProgress });

    await act(async () => {
      await Promise.resolve();
    });

    expect(onPuzzleProgress).toHaveBeenCalledTimes(1);
    expect(onPuzzleProgress.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        attemptNumber: 1,
        cyclePuzzle: pendingCyclePuzzle,
      }),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Echouer' }));
      await Promise.resolve();
    });

    expect(onPuzzleFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptNumber: 1,
        cyclePuzzle: pendingCyclePuzzle,
      }),
    );

    const failedCyclePuzzle: CyclePuzzle = {
      ...pendingCyclePuzzle,
      attemptCount: 1,
      completedAttemptCount: 1,
      status: 'failed',
    };

    view.rerender(
      <SolverView
        {...view.props}
        currentCyclePuzzle={failedCyclePuzzle}
        cyclePuzzles={[failedCyclePuzzle]}
        failedCyclePuzzleIris={new Set([failedCyclePuzzle['@id']])}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => { finishSave(); await Promise.resolve(); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Echouer' })); });
    expect(onPuzzleFailed).toHaveBeenLastCalledWith(expect.objectContaining({ attemptNumber: 2 }));
    expect(onPuzzleFailed.mock.calls[1][0].clientRequestId).not.toBe(onPuzzleFailed.mock.calls[0][0].clientRequestId);

    expect(onPuzzleProgress.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(onPuzzleProgress.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        attemptNumber: 2,
        cyclePuzzle: failedCyclePuzzle,
      }),
    );
  });

  it('fait avancer le chrono de 0:00 a 0:02 sur une tentative en cours', async () => {
    vi.useFakeTimers();

    renderSolver();

    expect(screen.getByText('0:00')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText('0:01')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText('0:02')).toBeInTheDocument();
  });

  it('redemarre automatiquement une nouvelle tentative sur un puzzle deja rate mais non fige', async () => {
    vi.useFakeTimers();
    const onPuzzleProgress = vi.fn().mockResolvedValue(undefined);
    const failedCyclePuzzle: CyclePuzzle = {
      ...pendingCyclePuzzle,
      status: 'failed',
      completedAttemptCount: 1,
      attemptCount: 1,
    };

    renderSolver({
      currentCyclePuzzle: failedCyclePuzzle,
      cyclePuzzles: [failedCyclePuzzle],
      failedCyclePuzzleIris: new Set([failedCyclePuzzle['@id']]),
      onPuzzleProgress,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(onPuzzleProgress).toHaveBeenCalledTimes(1);
    expect(onPuzzleProgress.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        attemptNumber: 2,
        cyclePuzzle: failedCyclePuzzle,
        trainingSession: '/api/training_sessions/1',
      }),
    );
  });

  it('reutilise la meme tentative lors du rerender du meme puzzle apres creation du snapshot local', async () => {
    const onPuzzleProgress = vi.fn().mockResolvedValue(undefined);
    const secondCyclePuzzle: CyclePuzzle = {
      ...pendingCyclePuzzle,
      '@id': '/api/cycle_puzzles/2',
      id: 2,
      position: 1,
      trainingPuzzle: secondTrainingPuzzle['@id'],
    };

    const view = renderSolver({
      cyclePuzzles: [pendingCyclePuzzle, secondCyclePuzzle],
      currentCyclePuzzle: secondCyclePuzzle,
      onPuzzleProgress,
      selectedTrainingPuzzle: secondTrainingPuzzle,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(onPuzzleProgress).toHaveBeenCalledTimes(1);
    const firstPayload = onPuzzleProgress.mock.calls[0][0];

    view.rerender(
      <SolverView
        {...view.props}
        cyclePuzzles={[pendingCyclePuzzle, { ...secondCyclePuzzle }]}
        currentCyclePuzzle={{ ...secondCyclePuzzle }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(onPuzzleProgress).toHaveBeenCalledTimes(1);
    expect(onPuzzleProgress.mock.calls[0][0].clientRequestId).toBe(firstPayload.clientRequestId);
  });

  it('reste stable quand le parent rerender le meme puzzle en in_progress puis qu un coup est joue', async () => {
    vi.useFakeTimers();

    const progressCalls: Array<{ clientRequestId: string; attemptNumber: number; durationMilliseconds: number; playedMoves: string[] }> = [];

    function SolverHarness() {
      const [cyclePuzzle, setCyclePuzzle] = useState<CyclePuzzle>({ ...pendingCyclePuzzle });

      async function handlePuzzleProgress(value: {
        attemptNumber: number;
        clientRequestId: string;
        durationMilliseconds: number;
        mistakesCount: number;
        playedMoves: string[];
        trainingSession: string;
      }) {
        progressCalls.push({
          attemptNumber: value.attemptNumber,
          clientRequestId: value.clientRequestId,
          durationMilliseconds: value.durationMilliseconds,
          playedMoves: value.playedMoves,
        });

        setCyclePuzzle((current) => ({
          ...current,
          activeAttempt: {
            '@id': current.activeAttempt?.['@id'] ?? '/api/attempts/1',
            attemptedAt: null,
            clientRequestId: value.clientRequestId,
            completedAt: null,
            cyclePuzzle: current['@id'],
            durationMilliseconds: value.durationMilliseconds,
            id: current.activeAttempt?.id ?? 1,
            mistakesCount: value.mistakesCount,
            playedMoves: value.playedMoves,
            startedAt: current.activeAttempt?.startedAt ?? '2026-08-10T09:00:00+00:00',
            status: 'in_progress',
            successful: false,
            trainingSession: value.trainingSession,
            attemptNumber: value.attemptNumber,
          },
          attempts: [
            {
              '@id': '/api/attempts/1',
              attemptedAt: null,
              clientRequestId: value.clientRequestId,
              completedAt: null,
              cyclePuzzle: current['@id'],
              durationMilliseconds: value.durationMilliseconds,
              id: 1,
              mistakesCount: value.mistakesCount,
              playedMoves: value.playedMoves,
              startedAt: '2026-08-10T09:00:00+00:00',
              status: 'in_progress',
              successful: false,
              trainingSession: value.trainingSession,
              attemptNumber: value.attemptNumber,
            },
          ],
          status: 'in_progress',
        }));
      }

      return (
        <SolverView
          activeTrainingSessionIri="/api/training_sessions/1"
          attemptIsError={false}
          attemptIsPending={false}
          currentCycle={currentCycle}
          cycleIsFinished={false}
          cyclePuzzles={[cyclePuzzle]}
          cycleStats={baseCycleStats}
          currentCyclePuzzle={cyclePuzzle}
          failedCyclePuzzleIris={new Set()}
          hasActiveCycle
          onBackToDashboard={vi.fn()}
          onBackToDetail={vi.fn()}
          onPuzzleCompleted={vi.fn()}
          onPuzzleFailed={vi.fn()}
          onPuzzleFirstMistake={vi.fn()}
          onPuzzleProgress={handlePuzzleProgress}
          onPuzzleSelect={vi.fn()}
          savedCyclePuzzleIris={new Set()}
          selectedPuzzle={selectedPuzzle}
          selectedTraining={training}
          selectedTrainingPuzzle={selectedTrainingPuzzle}
          summary={summary}
          trainingPuzzles={[selectedTrainingPuzzle]}
        />
      );
    }

    render(<SolverHarness />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(progressCalls).toHaveLength(1);
    expect(screen.getAllByText('En cours').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Jouer coup' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('puzzle-solver')).toBeInTheDocument();
    expect(progressCalls).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(progressCalls).toHaveLength(2);
    expect(progressCalls[1].clientRequestId).toBe(progressCalls[0].clientRequestId);
    expect(progressCalls[1].attemptNumber).toBe(progressCalls[0].attemptNumber);
    expect(progressCalls[1].durationMilliseconds).toBeGreaterThan(progressCalls[0].durationMilliseconds);
    expect(progressCalls[1].playedMoves).toEqual(['e2e4']);
  });

  it('n entre pas en boucle lors de la navigation vers un autre puzzle puis au retour', async () => {
    vi.useFakeTimers();

    const puzzleA: CyclePuzzle = { ...pendingCyclePuzzle, '@id': '/api/cycle_puzzles/1', id: 1, position: 0, trainingPuzzle: selectedTrainingPuzzle['@id'] };
    const puzzleB: CyclePuzzle = { ...pendingCyclePuzzle, '@id': '/api/cycle_puzzles/2', id: 2, position: 1, trainingPuzzle: secondTrainingPuzzle['@id'] };
    const progressCalls: Array<{ cyclePuzzleIri: string; clientRequestId: string; attemptNumber: number }> = [];

    function NavigationHarness() {
      const [selectedTrainingPuzzleIri, setSelectedTrainingPuzzleIri] = useState(selectedTrainingPuzzle['@id']);
      const [cyclePuzzles, setCyclePuzzles] = useState<CyclePuzzle[]>([puzzleA, puzzleB]);
      const currentCyclePuzzle = cyclePuzzles.find((item) => item.trainingPuzzle === selectedTrainingPuzzleIri) ?? null;
      const currentTrainingPuzzle = [selectedTrainingPuzzle, secondTrainingPuzzle].find((item) => item['@id'] === selectedTrainingPuzzleIri) ?? null;

      async function handlePuzzleProgress(value: {
        attemptNumber: number;
        clientRequestId: string;
        cyclePuzzle: CyclePuzzle;
        durationMilliseconds: number;
        mistakesCount: number;
        playedMoves: string[];
        trainingSession: string;
      }) {
        progressCalls.push({
          cyclePuzzleIri: value.cyclePuzzle['@id'],
          clientRequestId: value.clientRequestId,
          attemptNumber: value.attemptNumber,
        });

        setCyclePuzzles((current) => current.map((cyclePuzzle) => {
          if (cyclePuzzle['@id'] !== value.cyclePuzzle['@id']) {
            return cyclePuzzle;
          }

          const attemptIri = cyclePuzzle.activeAttempt?.['@id'] ?? '/api/attempts/' + String(cyclePuzzle.id);

          return {
            ...cyclePuzzle,
            status: 'in_progress',
            activeAttempt: {
              '@id': attemptIri,
              attemptedAt: null,
              clientRequestId: value.clientRequestId,
              completedAt: null,
              cyclePuzzle: cyclePuzzle['@id'],
              durationMilliseconds: value.durationMilliseconds,
              id: cyclePuzzle.activeAttempt?.id ?? cyclePuzzle.id,
              mistakesCount: value.mistakesCount,
              playedMoves: value.playedMoves,
              startedAt: cyclePuzzle.activeAttempt?.startedAt ?? '2026-08-10T09:00:00+00:00',
              status: 'in_progress',
              successful: false,
              trainingSession: value.trainingSession,
              attemptNumber: value.attemptNumber,
            },
            attempts: [
              {
                '@id': attemptIri,
                attemptedAt: null,
                clientRequestId: value.clientRequestId,
                completedAt: null,
                cyclePuzzle: cyclePuzzle['@id'],
                durationMilliseconds: value.durationMilliseconds,
                id: cyclePuzzle.id,
                mistakesCount: value.mistakesCount,
                playedMoves: value.playedMoves,
                startedAt: '2026-08-10T09:00:00+00:00',
                status: 'in_progress',
                successful: false,
                trainingSession: value.trainingSession,
                attemptNumber: value.attemptNumber,
              },
            ],
          };
        }));
      }

      return (
        <SolverView
          activeTrainingSessionIri="/api/training_sessions/1"
          attemptIsError={false}
          attemptIsPending={false}
          currentCycle={currentCycle}
          cycleIsFinished={false}
          cyclePuzzles={cyclePuzzles}
          cycleStats={baseCycleStats}
          currentCyclePuzzle={currentCyclePuzzle}
          failedCyclePuzzleIris={new Set()}
          hasActiveCycle
          onBackToDashboard={vi.fn()}
          onBackToDetail={vi.fn()}
          onPuzzleCompleted={vi.fn()}
          onPuzzleFailed={vi.fn()}
          onPuzzleFirstMistake={vi.fn()}
          onPuzzleProgress={handlePuzzleProgress}
          onPuzzleSelect={setSelectedTrainingPuzzleIri}
          savedCyclePuzzleIris={new Set()}
          selectedPuzzle={selectedPuzzle}
          selectedTraining={training}
          selectedTrainingPuzzle={currentTrainingPuzzle}
          summary={summary}
          trainingPuzzles={[selectedTrainingPuzzle, secondTrainingPuzzle]}
        />
      );
    }

    render(<NavigationHarness />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(progressCalls).toHaveLength(1);
    const firstAttempt = progressCalls[0];

    fireEvent.click(screen.getByRole('button', { name: /^Suivant$/ }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('puzzle-solver')).toBeInTheDocument();
    expect(progressCalls.length).toBeLessThanOrEqual(3);
    expect(progressCalls.at(-1)?.cyclePuzzleIri).toBe('/api/cycle_puzzles/2');
    expect(progressCalls.at(-1)?.clientRequestId).not.toBe(firstAttempt.clientRequestId);

    fireEvent.click(screen.getByRole('button', { name: /^Précédent$/ }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(progressCalls.length).toBeLessThanOrEqual(5);
    expect(progressCalls.at(-1)?.cyclePuzzleIri).toBe('/api/cycle_puzzles/1');
    expect(progressCalls.filter((call) => call.cyclePuzzleIri === '/api/cycle_puzzles/1').at(-1)?.clientRequestId).toBe(firstAttempt.clientRequestId);
  });

  it('la navigation entre puzzles ne bloque plus sur une requete reseau en cours', () => {
    const onPuzzleProgress = vi.fn(() => new Promise(() => {}));
    const onPuzzleSelect = vi.fn();

    renderSolver({ onPuzzleProgress, onPuzzleSelect });

    fireEvent.click(screen.getByRole('button', { name: /Suivant/ }));

    expect(onPuzzleSelect).toHaveBeenCalledWith('/api/training_puzzles/2');
  });
});
