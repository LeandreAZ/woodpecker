import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SolverView } from './TrainingsSolverView';
import type { CyclePuzzle, CycleStats, Puzzle, Training, TrainingPuzzle } from './trainingsTypes';

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

const baseCycleStats: CycleStats = {
  failed: 1,
  pending: 2,
  progressPercent: 33,
  solved: 1,
  total: 3,
};

const activeCyclePuzzle: CyclePuzzle = {
  '@id': '/api/cycle_puzzles/1',
  cycle: '/api/cycles/2',
  id: 1,
  position: 0,
  status: 'failed',
  trainingPuzzle: selectedTrainingPuzzle['@id'],
};

describe('SolverView', () => {
  it('propose un retour au tableau de bord quand aucun training n est ouvert', () => {
    const onBackToDashboard = vi.fn();

    render(
      <SolverView
        attemptIsError={false}
        attemptIsPending={false}
        cycleIsFinished={false}
        cyclePuzzles={[]}
        cycleStats={{ ...baseCycleStats, failed: 0, pending: 0, solved: 0, total: 1, progressPercent: 0 }}
        currentCyclePuzzle={null}
        failedCyclePuzzleIris={new Set()}
        hasActiveCycle={false}
        mistakeLimit={3}
        mistakeLimitIsError={false}
        mistakeLimitIsPending={false}
        onBackToDashboard={onBackToDashboard}
        onBackToDetail={vi.fn()}
        onMistakeLimitChange={vi.fn()}
        onPuzzleCompleted={vi.fn()}
        onPuzzleFailed={vi.fn()}
        onPuzzleSelect={vi.fn()}
        savedCyclePuzzleIris={new Set()}
        selectedTraining={null}
        selectedTrainingPuzzle={null}
        trainingPuzzles={[]}
      />,
    );

    expect(screen.getByText('Aucun entrainement ouvert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le tableau de bord' }));

    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });

  it('affiche un retour au detail quand le training ne contient encore aucun puzzle', () => {
    const onBackToDetail = vi.fn();

    render(
      <SolverView
        attemptIsError={false}
        attemptIsPending={false}
        cycleIsFinished={false}
        cyclePuzzles={[]}
        cycleStats={{ ...baseCycleStats, failed: 0, pending: 0, solved: 0, total: 0, progressPercent: 0 }}
        currentCyclePuzzle={null}
        failedCyclePuzzleIris={new Set()}
        hasActiveCycle={false}
        mistakeLimit={3}
        mistakeLimitIsError={false}
        mistakeLimitIsPending={false}
        onBackToDashboard={vi.fn()}
        onBackToDetail={onBackToDetail}
        onMistakeLimitChange={vi.fn()}
        onPuzzleCompleted={vi.fn()}
        onPuzzleFailed={vi.fn()}
        onPuzzleSelect={vi.fn()}
        savedCyclePuzzleIris={new Set()}
        selectedTraining={training}
        selectedTrainingPuzzle={null}
        trainingPuzzles={[]}
      />,
    );

    expect(screen.getByText('Ce training ne contient pas encore de puzzle')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retour au detail du training' }));

    expect(onBackToDetail).toHaveBeenCalledTimes(1);
  });

  it('affiche le mode libre quand aucun cycle actif ne suit la tentative', () => {
    render(
      <SolverView
        attemptIsError={false}
        attemptIsPending={false}
        cycleIsFinished={false}
        cyclePuzzles={[]}
        cycleStats={{ ...baseCycleStats, failed: 0, pending: 0, solved: 0, total: 1, progressPercent: 0 }}
        currentCyclePuzzle={null}
        failedCyclePuzzleIris={new Set()}
        hasActiveCycle={false}
        mistakeLimit={3}
        mistakeLimitIsError={false}
        mistakeLimitIsPending={false}
        onBackToDashboard={vi.fn()}
        onBackToDetail={vi.fn()}
        onMistakeLimitChange={vi.fn()}
        onPuzzleCompleted={vi.fn()}
        onPuzzleFailed={vi.fn()}
        onPuzzleSelect={vi.fn()}
        savedCyclePuzzleIris={new Set()}
        selectedPuzzle={selectedPuzzle}
        selectedTraining={training}
        selectedTrainingPuzzle={selectedTrainingPuzzle}
        trainingPuzzles={[selectedTrainingPuzzle]}
      />,
    );

    expect(screen.getByText('Mode libre', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/Demarre un cycle depuis le detail/)).toBeInTheDocument();
    expect(screen.getByTestId('puzzle-solver')).toBeInTheDocument();
  });

  it('met en avant un puzzle a revoir et laisse changer la tolerance', () => {
    const onMistakeLimitChange = vi.fn();

    render(
      <SolverView
        attemptIsError={false}
        attemptIsPending={false}
        cycleIsFinished={false}
        cyclePuzzles={[activeCyclePuzzle]}
        cycleStats={baseCycleStats}
        currentCyclePuzzle={activeCyclePuzzle}
        failedCyclePuzzleIris={new Set(['/api/cycle_puzzles/1'])}
        hasActiveCycle={true}
        mistakeLimit={3}
        mistakeLimitIsError={false}
        mistakeLimitIsPending={false}
        onBackToDashboard={vi.fn()}
        onBackToDetail={vi.fn()}
        onMistakeLimitChange={onMistakeLimitChange}
        onPuzzleCompleted={vi.fn()}
        onPuzzleFailed={vi.fn()}
        onPuzzleSelect={vi.fn()}
        savedCyclePuzzleIris={new Set()}
        selectedPuzzle={selectedPuzzle}
        selectedTraining={training}
        selectedTrainingPuzzle={selectedTrainingPuzzle}
        trainingPuzzles={[selectedTrainingPuzzle]}
      />,
    );

    expect(screen.getByText('Cycle actif', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/Ce puzzle est marque a revoir/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '5' }));

    expect(onMistakeLimitChange).toHaveBeenCalledWith(5);
  });


  it('transmet les callbacks de resolution quand le puzzle actif est encore jouable', () => {
    const onPuzzleCompleted = vi.fn();
    const onPuzzleFailed = vi.fn();
    const onPuzzleSelect = vi.fn();

    render(
      <SolverView
        attemptIsError={false}
        attemptIsPending={false}
        cycleIsFinished={false}
        cyclePuzzles={[{ ...activeCyclePuzzle, status: 'pending' }]}
        cycleStats={baseCycleStats}
        currentCyclePuzzle={{ ...activeCyclePuzzle, status: 'pending' }}
        failedCyclePuzzleIris={new Set()}
        hasActiveCycle={true}
        mistakeLimit={3}
        mistakeLimitIsError={false}
        mistakeLimitIsPending={false}
        onBackToDashboard={vi.fn()}
        onBackToDetail={vi.fn()}
        onMistakeLimitChange={vi.fn()}
        onPuzzleCompleted={onPuzzleCompleted}
        onPuzzleFailed={onPuzzleFailed}
        onPuzzleSelect={onPuzzleSelect}
        savedCyclePuzzleIris={new Set()}
        selectedPuzzle={selectedPuzzle}
        selectedTraining={training}
        selectedTrainingPuzzle={selectedTrainingPuzzle}
        trainingPuzzles={[selectedTrainingPuzzle]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Completer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Echouer' }));
    fireEvent.click(screen.getByRole('button', { name: '1 Rating 1600 En cours' }));

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
    expect(onPuzzleSelect).toHaveBeenCalledWith('/api/training_puzzles/1');
  });

  it('bloque les callbacks et affiche les messages de sauvegarde quand le puzzle est deja traite', () => {
    const onPuzzleCompleted = vi.fn();
    const onPuzzleFailed = vi.fn();

    render(
      <SolverView
        attemptError='Tentative impossible pour le moment.'
        attemptIsError={true}
        attemptIsPending={true}
        cycleIsFinished={true}
        cyclePuzzles={[activeCyclePuzzle]}
        cycleStats={{ ...baseCycleStats, solved: 2, failed: 1, pending: 0, progressPercent: 100 }}
        currentCyclePuzzle={{ ...activeCyclePuzzle, status: 'solved' }}
        failedCyclePuzzleIris={new Set(['/api/cycle_puzzles/1'])}
        hasActiveCycle={true}
        mistakeLimit={3}
        mistakeLimitError='Impossible de changer la tolerance.'
        mistakeLimitIsError={true}
        mistakeLimitIsPending={true}
        onBackToDashboard={vi.fn()}
        onBackToDetail={vi.fn()}
        onMistakeLimitChange={vi.fn()}
        onPuzzleCompleted={onPuzzleCompleted}
        onPuzzleFailed={onPuzzleFailed}
        onPuzzleSelect={vi.fn()}
        savedCyclePuzzleIris={new Set(['/api/cycle_puzzles/1'])}
        selectedPuzzle={selectedPuzzle}
        selectedTraining={training}
        selectedTrainingPuzzle={selectedTrainingPuzzle}
        trainingPuzzles={[selectedTrainingPuzzle]}
      />,
    );

    expect(screen.getByText('Cycle termine')).toBeInTheDocument();
    expect(screen.getByText(/Ce puzzle est deja sauvegarde comme resolu/)).toBeInTheDocument();
    expect(screen.getByText('Sauvegarde de la tolerance...')).toBeInTheDocument();
    expect(screen.getByText('Impossible de changer la tolerance.')).toBeInTheDocument();
    expect(screen.getByText('Sauvegarde de la tentative...')).toBeInTheDocument();
    expect(screen.getByText('Tentative impossible pour le moment.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Completer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Echouer' }));

    expect(onPuzzleCompleted).not.toHaveBeenCalled();
    expect(onPuzzleFailed).not.toHaveBeenCalled();
  });
});
