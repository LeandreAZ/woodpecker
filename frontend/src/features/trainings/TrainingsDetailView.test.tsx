import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UseMutationResult } from '@tanstack/react-query';
import { DetailView } from './TrainingsDetailView';
import type { CycleStats, Training, TrainingAnalytics, TrainingPuzzle, TrainingSummary } from './trainingsTypes';

const training: Training = {
  '@id': '/api/trainings/1',
  createdAt: '2026-08-06T18:10:00+00:00',
  description: 'Set tactique exigeant',
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
  failed: 1,
  pending: 2,
  progressPercent: 33,
  solved: 1,
  total: 3,
};

const summary: TrainingSummary = {
  attemptCount: 2,
  averageMistakes: 1.5,
  cycleSummaries: [
    {
      attemptCount: 2,
      cycle: {
        '@id': '/api/cycles/2',
        completedAt: null,
        id: 2,
        number: 2,
        startedAt: '2026-08-07T09:00:00+00:00',
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
  latestAttempts: [
    {
      '@id': '/api/attempts/3',
      attemptedAt: '2026-08-07T09:10:00+00:00',
      cycleNumber: 2,
      durationMilliseconds: 12000,
      id: 3,
      mistakesCount: 1,
      successful: true,
      trainingPuzzlePosition: 0,
    },
  ],
  latestCycleSummary: {
    attemptCount: 2,
    cycle: {
      '@id': '/api/cycles/2',
      completedAt: null,
      id: 2,
      number: 2,
      startedAt: '2026-08-07T09:00:00+00:00',
      status: 'active',
      training: training['@id'],
    },
    failed: 1,
    pending: 2,
    progressPercent: 33,
    solved: 1,
    total: 3,
  },
  notedPuzzleCount: 1,
  puzzleCount: 1,
  ratedPuzzleCount: 1,
  solvedAttemptCount: 1,
  themedPuzzleCount: 1,
};

const analytics: TrainingAnalytics = {
  cycleTimeline: [
    {
      attemptCount: 2,
      cycle: {
        '@id': '/api/cycles/2',
        completedAt: null,
        id: 2,
        number: 2,
        startedAt: '2026-08-07T09:00:00+00:00',
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
  performance: {
    attemptCount: 2,
    averageDurationSeconds: 17,
    averageMistakes: 2,
    failedAttemptCount: 1,
    latestAttemptedAt: '2026-08-07T09:10:00+00:00',
    solvedAttemptCount: 1,
    successRate: 50,
  },
  progressionSnapshot: {
    activeCycleCount: 1,
    bestCycleProgressPercent: 33,
    completedCycleCount: 0,
    latestCycleProgressPercent: 33,
    resumableCycle: true,
  },
  puzzleReadiness: {
    notedPuzzleCount: 1,
    puzzleCount: 1,
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

describe('DetailView', () => {
  it('propose un retour au tableau de bord si aucun training n est selectionne', () => {
    const onBackToDashboard = vi.fn();

    render(
      <DetailView
        analytics={null}
        analyticsIsError={false}
        analyticsIsLoading={false}
        createPuzzleMutation={createMutationMock()}
        cycleStats={cycleStats}
        cycleStatusLabel='Aucun'
        deletePuzzleIsError={false}
        deletePuzzleIsPending={false}
        fen=''
        hasResumableCycle={false}
        movePuzzleIsError={false}
        movePuzzleIsPending={false}
        onBackToDashboard={onBackToDashboard}
        onFenChange={vi.fn()}
        onImport={vi.fn()}
        onOpenSolver={vi.fn()}
        onPersonalNoteChange={vi.fn()}
        onPuzzleDelete={vi.fn()}
        onPuzzleMove={vi.fn()}
        onPuzzleSelect={vi.fn()}
        onRatingChange={vi.fn()}
        onSolutionTextChange={vi.fn()}
        onStartCycle={vi.fn()}
        onThemesTextChange={vi.fn()}
        personalNote=''
        puzzleCount={0}
        puzzleListIsLocked={false}
        rating=''
        selectedTraining={null}
        solutionText=''
        startCycleIsError={false}
        startCycleIsPending={false}
        summary={null}
        summaryIsError={false}
        summaryIsLoading={false}
        themesText=''
        trainingPuzzles={[]}
        trainingPuzzlesIsError={false}
        trainingPuzzlesIsLoading={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retour au tableau de bord' }));

    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });

  it('affiche clairement l etat verrouille, la reprise de cycle et les analytics', () => {
    render(
      <DetailView
        analytics={analytics}
        analyticsIsError={false}
        analyticsIsLoading={false}
        createPuzzleMutation={createMutationMock()}
        cycleStats={cycleStats}
        cycleStatusLabel='Actif'
        deletePuzzleIsError={false}
        deletePuzzleIsPending={false}
        fen=''
        hasResumableCycle={true}
        movePuzzleIsError={false}
        movePuzzleIsPending={false}
        onBackToDashboard={vi.fn()}
        onFenChange={vi.fn()}
        onImport={vi.fn()}
        onOpenSolver={vi.fn()}
        onPersonalNoteChange={vi.fn()}
        onPuzzleDelete={vi.fn()}
        onPuzzleMove={vi.fn()}
        onPuzzleSelect={vi.fn()}
        onRatingChange={vi.fn()}
        onSolutionTextChange={vi.fn()}
        onStartCycle={vi.fn()}
        onThemesTextChange={vi.fn()}
        personalNote=''
        puzzleCount={1}
        puzzleListIsLocked={true}
        rating=''
        selectedTraining={training}
        solutionText='e2e4'
        startCycleIsError={false}
        startCycleIsPending={false}
        summary={summary}
        summaryIsError={false}
        summaryIsLoading={false}
        themesText=''
        trainingPuzzles={[trainingPuzzle]}
        trainingPuzzlesIsError={false}
        trainingPuzzlesIsLoading={false}
      />,
    );

    expect(screen.getAllByText('Collection verrouillee').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Reprendre le cycle' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Importer CSV' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Cycle 2' })).toBeInTheDocument();
    expect(screen.getByText(/Cycle reprenable/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Progression du training' })).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.getByText(/1\.5 erreur\(s\) \/ tentative/)).toBeInTheDocument();
  });

  it('demande une confirmation avant de retirer un puzzle de draft', () => {
    const onPuzzleDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <DetailView
        analytics={null}
        analyticsIsError={false}
        analyticsIsLoading={false}
        createPuzzleMutation={createMutationMock()}
        cycleStats={cycleStats}
        cycleStatusLabel='Aucun'
        deletePuzzleIsError={false}
        deletePuzzleIsPending={false}
        fen=''
        hasResumableCycle={false}
        movePuzzleIsError={false}
        movePuzzleIsPending={false}
        onBackToDashboard={vi.fn()}
        onFenChange={vi.fn()}
        onImport={vi.fn()}
        onOpenSolver={vi.fn()}
        onPersonalNoteChange={vi.fn()}
        onPuzzleDelete={onPuzzleDelete}
        onPuzzleMove={vi.fn()}
        onPuzzleSelect={vi.fn()}
        onRatingChange={vi.fn()}
        onSolutionTextChange={vi.fn()}
        onStartCycle={vi.fn()}
        onThemesTextChange={vi.fn()}
        personalNote=''
        puzzleCount={1}
        puzzleListIsLocked={false}
        rating=''
        selectedTraining={training}
        solutionText='e2e4'
        startCycleIsError={false}
        startCycleIsPending={false}
        summary={null}
        summaryIsError={false}
        summaryIsLoading={false}
        themesText=''
        trainingPuzzles={[trainingPuzzle]}
        trainingPuzzlesIsError={false}
        trainingPuzzlesIsLoading={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le puzzle 1' }));

    expect(window.confirm).toHaveBeenCalledWith('Supprimer le puzzle 1 de ce training ?');
    expect(onPuzzleDelete).toHaveBeenCalledWith('/api/training_puzzles/1');
  });


  it('affiche les etats de chargement et les erreurs du detail sans masquer les zones utiles', () => {
    render(
      <DetailView
        analytics={null}
        analyticsError='Analytics indisponibles.'
        analyticsIsError={true}
        analyticsIsLoading={true}
        createPuzzleMutation={createMutationMock()}
        cycleStats={cycleStats}
        cycleStatusLabel='Aucun'
        deletePuzzleError='Suppression impossible.'
        deletePuzzleIsError={true}
        deletePuzzleIsPending={false}
        fen=''
        hasResumableCycle={false}
        movePuzzleError='Reordonnancement impossible.'
        movePuzzleIsError={true}
        movePuzzleIsPending={false}
        onBackToDashboard={vi.fn()}
        onFenChange={vi.fn()}
        onImport={vi.fn()}
        onOpenSolver={vi.fn()}
        onPersonalNoteChange={vi.fn()}
        onPuzzleDelete={vi.fn()}
        onPuzzleMove={vi.fn()}
        onPuzzleSelect={vi.fn()}
        onRatingChange={vi.fn()}
        onSolutionTextChange={vi.fn()}
        onStartCycle={vi.fn()}
        onThemesTextChange={vi.fn()}
        personalNote=''
        puzzleCount={1}
        puzzleListIsLocked={false}
        rating=''
        selectedTraining={training}
        solutionText='e2e4'
        startCycleError='Demarrage impossible.'
        startCycleIsError={true}
        startCycleIsPending={false}
        summary={null}
        summaryError='Resume indisponible.'
        summaryIsError={true}
        summaryIsLoading={true}
        themesText=''
        trainingPuzzles={[trainingPuzzle]}
        trainingPuzzlesError='Chargement des puzzles impossible.'
        trainingPuzzlesIsError={true}
        trainingPuzzlesIsLoading={true}
      />,
    );

    expect(screen.getByText('Chargement des analytics...')).toBeInTheDocument();
    expect(screen.getByText('Analytics indisponibles.')).toBeInTheDocument();
    expect(screen.getByText('Chargement des puzzles...')).toBeInTheDocument();
    expect(screen.getByText('Chargement du resume...')).toBeInTheDocument();
    expect(screen.getByText('Chargement des tentatives...')).toBeInTheDocument();
    expect(screen.getByText('Demarrage impossible.')).toBeInTheDocument();
    expect(screen.getByText('Chargement des puzzles impossible.')).toBeInTheDocument();
    expect(screen.getByText('Suppression impossible.')).toBeInTheDocument();
    expect(screen.getByText('Reordonnancement impossible.')).toBeInTheDocument();
    expect(screen.getAllByText('Resume indisponible.').length).toBe(2);
  });

  it('laisse importer, lancer le cycle, ouvrir le solveur et reordonner les puzzles en draft', () => {
    const onImport = vi.fn();
    const onOpenSolver = vi.fn();
    const onStartCycle = vi.fn();
    const onPuzzleMove = vi.fn();
    const onPuzzleSelect = vi.fn();

    const secondTrainingPuzzle: TrainingPuzzle = {
      '@id': '/api/training_puzzles/2',
      id: 2,
      personalNote: null,
      position: 1,
      puzzle: {
        '@id': '/api/puzzles/10',
        id: 10,
        rating: 1750,
        solution: ['d2d4'],
        themes: ['pin'],
      },
      training: training['@id'],
    };

    render(
      <DetailView
        analytics={null}
        analyticsIsError={false}
        analyticsIsLoading={false}
        createPuzzleMutation={createMutationMock()}
        cycleStats={cycleStats}
        cycleStatusLabel='Aucun'
        deletePuzzleIsError={false}
        deletePuzzleIsPending={false}
        fen=''
        hasResumableCycle={false}
        movePuzzleIsError={false}
        movePuzzleIsPending={false}
        onBackToDashboard={vi.fn()}
        onFenChange={vi.fn()}
        onImport={onImport}
        onOpenSolver={onOpenSolver}
        onPersonalNoteChange={vi.fn()}
        onPuzzleDelete={vi.fn()}
        onPuzzleMove={onPuzzleMove}
        onPuzzleSelect={onPuzzleSelect}
        onRatingChange={vi.fn()}
        onSolutionTextChange={vi.fn()}
        onStartCycle={onStartCycle}
        onThemesTextChange={vi.fn()}
        personalNote=''
        puzzleCount={2}
        puzzleListIsLocked={false}
        rating=''
        selectedTraining={training}
        solutionText='e2e4'
        startCycleIsError={false}
        startCycleIsPending={false}
        summary={summary}
        summaryIsError={false}
        summaryIsLoading={false}
        themesText=''
        trainingPuzzles={[trainingPuzzle, secondTrainingPuzzle]}
        trainingPuzzlesIsError={false}
        trainingPuzzlesIsLoading={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le solveur' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Importer CSV' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Demarrer le cycle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descendre le puzzle 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Monter le puzzle 2' }));
    fireEvent.click(screen.getByRole('button', { name: /e2e4/ }));

    expect(onOpenSolver).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onStartCycle).toHaveBeenCalledTimes(1);
    expect(onPuzzleMove).toHaveBeenNthCalledWith(1, '/api/training_puzzles/1', 'down');
    expect(onPuzzleMove).toHaveBeenNthCalledWith(2, '/api/training_puzzles/2', 'up');
    expect(onPuzzleSelect).toHaveBeenCalledWith('/api/training_puzzles/1');
    expect(screen.getByRole('button', { name: 'Monter le puzzle 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descendre le puzzle 2' })).toBeDisabled();
  });
});
