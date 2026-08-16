import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  DashboardView,
  FuturePageView,
  HistoryOverviewView,
  ImportView,
  SettingsOverviewView,
  StatsOverviewView,
} from './TrainingsPanelViews';
import type {
  HistoryOverview,
  StatsOverview,
  Training,
  TrainingAttemptHistory,
  TrainingCycleHistory,
  TrainingDashboardSummary,
  UserSettingsOverview,
} from './trainingsTypes';

const training: Training = {
  '@id': '/api/trainings/1',
  createdAt: '2026-08-06T18:10:00+00:00',
  description: 'Set tactique',
  id: 1,
  mistakeLimit: 3,
  name: 'Mate en 2',
  status: 'draft',
};

const trainingTwo: Training = {
  '@id': '/api/trainings/2',
  createdAt: '2026-08-05T18:10:00+00:00',
  description: 'Set mixte',
  id: 2,
  mistakeLimit: 5,
  name: 'Tactiques mixtes',
  status: 'active',
};

const summary: TrainingDashboardSummary = {
  attemptCount: 12,
  descriptionReady: true,
  failedCount: 3,
  hasResumableCycle: true,
  latestAttemptedAt: '2026-08-06T18:10:00+00:00',
  latestCycleNumber: 2,
  latestCycleStatus: 'active',
  pendingCount: 4,
  progressPercent: 58,
  puzzleCount: 24,
  solvedCount: 14,
  training,
};

const statsOverview: StatsOverview = {
  activeCycleCount: 1,
  attemptCount: 14,
  averageMistakes: 1.4,
  completedCycleCount: 2,
  failedCyclePuzzleCount: 3,
  latestAttemptedAt: '2026-08-08T18:10:00+00:00',
  pendingCyclePuzzleCount: 4,
  puzzleCount: 30,
  resumableTrainingCount: 1,
  solvedCyclePuzzleCount: 18,
  successRate: 71,
  successfulAttemptCount: 10,
  trainingBreakdown: [summary],
  trainingCount: 3,
};

const historyOverview: HistoryOverview = {
  activeCycleCount: 1,
  attemptCount: 9,
  completedCycleCount: 2,
  cycleCount: 3,
  failedAttemptCount: 2,
  latestAttemptedAt: '2026-08-08T18:10:00+00:00',
  recentAttempts: [
    {
      '@id': '/api/attempts/1',
      attemptedAt: '2026-08-08T18:10:00+00:00',
      cycleNumber: 2,
      durationMilliseconds: 19000,
      id: 1,
      mistakesCount: 1,
      successful: true,
      training: {
        '@id': '/api/trainings/1',
        description: 'Set tactique',
        id: 1,
        name: 'Mate en 2',
        status: 'draft',
      },
      trainingPuzzlePosition: 0,
    },
    {
      '@id': '/api/attempts/2',
      attemptedAt: '2026-08-07T18:10:00+00:00',
      cycleNumber: 1,
      durationMilliseconds: 21000,
      id: 2,
      mistakesCount: 2,
      successful: false,
      training: {
        '@id': '/api/trainings/2',
        description: 'Set mixte',
        id: 2,
        name: 'Tactiques mixtes',
        status: 'active',
      },
      trainingPuzzlePosition: 2,
    },
  ],
  recentCycles: [
    {
      attemptCount: 4,
      cycle: {
        '@id': '/api/cycles/2',
        completedAt: null,
        id: 2,
        number: 2,
        startedAt: '2026-08-08T17:45:00+00:00',
        status: 'active',
        training: '/api/trainings/1',
      },
      failed: 1,
      hasResumableCycle: true,
      pending: 2,
      progressPercent: 50,
      solved: 3,
      total: 6,
      training: {
        '@id': '/api/trainings/1',
        description: 'Set tactique',
        id: 1,
        name: 'Mate en 2',
        status: 'draft',
      },
    },
    {
      attemptCount: 3,
      cycle: {
        '@id': '/api/cycles/3',
        completedAt: '2026-08-07T18:30:00+00:00',
        id: 3,
        number: 1,
        startedAt: '2026-08-07T17:45:00+00:00',
        status: 'completed',
        training: '/api/trainings/2',
      },
      failed: 0,
      hasResumableCycle: false,
      pending: 0,
      progressPercent: 100,
      solved: 5,
      total: 5,
      training: {
        '@id': '/api/trainings/2',
        description: 'Set mixte',
        id: 2,
        name: 'Tactiques mixtes',
        status: 'active',
      },
    },
  ],
  successfulAttemptCount: 7,
};


const attemptHistory: TrainingAttemptHistory = {
  attemptCount: 2,
  attempts: [
    {
      '@id': '/api/attempts/10',
      attemptedAt: '2026-08-08T18:10:00+00:00',
      cycle: {
        '@id': '/api/cycles/2',
        id: 2,
        number: 2,
        status: 'active',
      },
      cyclePuzzle: {
        '@id': '/api/cycle_puzzles/5',
        id: 5,
        position: 0,
        status: 'solved',
      },
      durationMilliseconds: 19000,
      id: 10,
      mistakesCount: 1,
      playedMoves: ['e2e4'],
      puzzle: {
        '@id': '/api/puzzles/9',
        id: 9,
        rating: 1600,
        solution: ['e2e4'],
        themes: ['fork'],
      },
      successful: true,
      trainingPuzzle: {
        '@id': '/api/training_puzzles/1',
        id: 1,
        personalNote: 'Angle de mat',
        position: 0,
      },
    },
    {
      '@id': '/api/attempts/11',
      attemptedAt: '2026-08-07T18:10:00+00:00',
      cycle: {
        '@id': '/api/cycles/1',
        id: 1,
        number: 1,
        status: 'completed',
      },
      cyclePuzzle: {
        '@id': '/api/cycle_puzzles/6',
        id: 6,
        position: 1,
        status: 'failed',
      },
      durationMilliseconds: 21000,
      id: 11,
      mistakesCount: 2,
      playedMoves: ['g1f3'],
      puzzle: null,
      successful: false,
      trainingPuzzle: {
        '@id': '/api/training_puzzles/2',
        id: 2,
        personalNote: null,
        position: 1,
      },
    },
  ],
  failedAttemptCount: 1,
  latestAttemptedAt: '2026-08-08T18:10:00+00:00',
  successfulAttemptCount: 1,
  training,
};

const cycleHistory: TrainingCycleHistory = {
  activeCycleCount: 1,
  completedCycleCount: 1,
  cycleCount: 2,
  cycles: [
    {
      attemptCount: 1,
      cycle: {
        '@id': '/api/cycles/2',
        completedAt: null,
        id: 2,
        number: 2,
        startedAt: '2026-08-08T17:45:00+00:00',
        status: 'active',
        targetDurationSeconds: 1200,
        training: '/api/trainings/1',
      },
      cyclePuzzles: [
        {
          '@id': '/api/cycle_puzzles/5',
          completedAt: '2026-08-08T18:10:00+00:00',
          id: 5,
          position: 0,
          status: 'solved',
          trainingPuzzle: {
            '@id': '/api/training_puzzles/1',
            id: 1,
            personalNote: 'Angle de mat',
            position: 0,
          },
        },
      ],
      failed: 0,
      hasResumableCycle: true,
      latestAttemptedAt: '2026-08-08T18:10:00+00:00',
      pending: 1,
      progressPercent: 50,
      solved: 1,
      total: 2,
    },
    {
      attemptCount: 1,
      cycle: {
        '@id': '/api/cycles/1',
        completedAt: '2026-08-07T18:30:00+00:00',
        id: 1,
        number: 1,
        startedAt: '2026-08-07T17:45:00+00:00',
        status: 'completed',
        targetDurationSeconds: 900,
        training: '/api/trainings/1',
      },
      cyclePuzzles: [],
      failed: 1,
      hasResumableCycle: false,
      latestAttemptedAt: '2026-08-07T18:10:00+00:00',
      pending: 0,
      progressPercent: 0,
      solved: 0,
      total: 1,
    },
  ],
  training,
};

const settingsOverview: UserSettingsOverview = {
  integrations: {
    chessComConnected: false,
    exportReady: true,
    lichessConnected: false,
  },
  preferencesPreview: {
    defaultMistakeLimit: 4,
    lockTrainingAfterCycle: true,
    trackedSolverByDefault: true,
  },
  user: {
    '@id': '/api/users/7',
    createdAt: '2026-08-01T09:00:00+00:00',
    email: 'owner@example.com',
    id: 7,
    roles: ['ROLE_ADMIN', 'ROLE_USER'],
  },
  workspace: {
    activeTrainingCount: 1,
    archivedTrainingCount: 1,
    latestTrainingName: 'Mate en 2',
    puzzleCount: 24,
    trainingCount: 2,
  },
};

describe('DashboardView', () => {
  it('affiche les resumes de dashboard et permet de reprendre un cycle', () => {
    const onCreate = vi.fn();
    const onOpenTraining = vi.fn();

    render(
      <DashboardView
        dashboardSummaries={[summary]}
        isError={false}
        isLoading={false}
        onCreate={onCreate}
        onOpenTraining={onOpenTraining}
        selectedTrainingIri={training['@id']}
        trainings={[training]}
      />,
    );

    expect(screen.getByText('Cycles a reprendre')).toBeInTheDocument();
    expect(screen.getByText('Cycle 2 actif')).toBeInTheDocument();
    expect(screen.getByText('24 puzzle(s)')).toBeInTheDocument();
    expect(screen.getByText('12 tentative(s)')).toBeInTheDocument();
    expect(screen.getByText('14 resolu(s)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reprendre' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));

    expect(onOpenTraining).toHaveBeenCalledWith('/api/trainings/1', 'solver');
  });

  it('garde les cartes visibles pendant le chargement des resumes', () => {
    render(
      <DashboardView
        dashboardSummaries={[]}
        isError={false}
        isLoading={true}
        onCreate={vi.fn()}
        onOpenTraining={vi.fn()}
        selectedTrainingIri={null}
        trainings={[training]}
      />,
    );

    expect(screen.getByText('Chargement des entrainements...')).toBeInTheDocument();
    expect(screen.queryByText('Mate en 2')).not.toBeInTheDocument();
  });

  it('reste navigable avec des cartes simplifiees si le resume dedie echoue', () => {
    const onOpenTraining = vi.fn();

    render(
      <DashboardView
        dashboardSummaries={[]}
        errorMessage='Resume indisponible.'
        isError={true}
        isLoading={false}
        onCreate={vi.fn()}
        onOpenTraining={onOpenTraining}
        selectedTrainingIri={null}
        trainings={[training]}
      />,
    );

    expect(screen.getByText('Resume indisponible.')).toBeInTheDocument();
    expect(screen.queryByText('Mate en 2')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ouvrir' })).not.toBeInTheDocument();
    expect(onOpenTraining).not.toHaveBeenCalled();
  });
});

describe('StatsOverviewView', () => {
  it('affiche de vraies statistiques et permet d ouvrir un training', () => {
    const onOpenTraining = vi.fn();

    render(
      <StatsOverviewView
        isError={false}
        isLoading={false}
        onOpenTraining={onOpenTraining}
        statsOverview={statsOverview}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Statistiques globales' })).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();
    expect(screen.getByText('1 cycle(s) actif(s)')).toBeInTheDocument();
    expect(screen.getByText('Mate en 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));

    expect(onOpenTraining).toHaveBeenCalledWith('/api/trainings/1', 'solver');
  });
});

describe('HistoryOverviewView', () => {
  it('affiche l historique global et permet de rouvrir le training source', () => {
    const onBackToDashboard = vi.fn();
    const onOpenTraining = vi.fn();

    render(
      <HistoryOverviewView
        attemptHistory={null}
        cycleHistory={null}
        historyOverview={historyOverview}
        isDetailedError={false}
        isDetailedLoading={false}
        isError={false}
        isLoading={false}
        onBackToDashboard={onBackToDashboard}
        onOpenTraining={onOpenTraining}
        selectedTraining={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Historique détaillé' })).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getAllByText('Mate en 2').length).toBeGreaterThan(0);
    expect(screen.getByText('Reussi - Cycle 2 - Puzzle 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Ouvrir' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Retour au tableau de bord' }));

    expect(onOpenTraining).toHaveBeenNthCalledWith(1, '/api/trainings/1', 'solver');
    expect(onOpenTraining).toHaveBeenNthCalledWith(2, '/api/trainings/2', 'detail');
    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });



  it('affiche le detail du training selectionne avec cycles et tentatives enrichis', () => {
    render(
      <HistoryOverviewView
        attemptHistory={attemptHistory}
        cycleHistory={cycleHistory}
        historyOverview={historyOverview}
        isDetailedError={false}
        isDetailedLoading={false}
        isError={false}
        isLoading={false}
        onBackToDashboard={vi.fn()}
        onOpenTraining={vi.fn()}
        selectedTraining={training}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Mate en 2' })).toBeInTheDocument();
    expect(screen.getByText('Historique du training')).toBeInTheDocument();
    expect(screen.getByText(/Tentatives détaillées/i)).toBeInTheDocument();
    expect(screen.getByText('1200s cible')).toBeInTheDocument();
    expect(screen.getByText(/e2e4 - Angle de mat/)).toBeInTheDocument();
    expect(screen.getByText(/Derniere activite 08\/08 18:10/)).toBeInTheDocument();
  });

  it('affiche un etat de chargement pour le focus training detaille', () => {
    render(
      <HistoryOverviewView
        attemptHistory={null}
        cycleHistory={null}
        historyOverview={historyOverview}
        isDetailedError={false}
        isDetailedLoading={true}
        isError={false}
        isLoading={false}
        onBackToDashboard={vi.fn()}
        onOpenTraining={vi.fn()}
        selectedTraining={training}
      />,
    );

    expect(screen.getByText('Chargement du detail du training...')).toBeInTheDocument();
  });

  it('affiche une erreur detaillee si le focus training echoue', () => {
    render(
      <HistoryOverviewView
        attemptHistory={null}
        cycleHistory={null}
        detailedErrorMessage='Historique detaille indisponible.'
        historyOverview={historyOverview}
        isDetailedError={true}
        isDetailedLoading={false}
        isError={false}
        isLoading={false}
        onBackToDashboard={vi.fn()}
        onOpenTraining={vi.fn()}
        selectedTraining={training}
      />,
    );

    expect(screen.getByText('Historique detaille indisponible.')).toBeInTheDocument();
  });

  it('invite a selectionner un training pour afficher le focus detaille', () => {
    render(
      <HistoryOverviewView
        attemptHistory={null}
        cycleHistory={null}
        historyOverview={historyOverview}
        isDetailedError={false}
        isDetailedLoading={false}
        isError={false}
        isLoading={false}
        onBackToDashboard={vi.fn()}
        onOpenTraining={vi.fn()}
        selectedTraining={null}
      />,
    );

    expect(screen.getByText(/Sélectionne un training pour afficher son historique détaillé\./i)).toBeInTheDocument();
  });

  it('filtre l historique par training, surface et etat', () => {
    render(
      <HistoryOverviewView
        attemptHistory={null}
        cycleHistory={null}
        historyOverview={historyOverview}
        isDetailedError={false}
        isDetailedLoading={false}
        isError={false}
        isLoading={false}
        onBackToDashboard={vi.fn()}
        onOpenTraining={vi.fn()}
        selectedTraining={null}
      />,
    );

    fireEvent.change(screen.getByLabelText('Training'), { target: { value: '/api/trainings/2' } });
    fireEvent.change(screen.getByLabelText('Surface'), { target: { value: 'attempts' } });
    fireEvent.change(screen.getByLabelText('Etat'), { target: { value: 'failed' } });

    expect(screen.getAllByText('Tactiques mixtes').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Reussi - Cycle 2 - Puzzle 1/)).not.toBeInTheDocument();
    expect(screen.getByText('Aucun cycle ne correspond aux filtres actuels.')).toBeInTheDocument();
    expect(screen.getByText(/À revoir - Cycle 1 - Puzzle 3/)).toBeInTheDocument();
  });
});

describe('SettingsOverviewView', () => {
  it('affiche le profil, les preferences et les integrations en preparation', () => {
    const onBackToDashboard = vi.fn();

    render(
      <SettingsOverviewView
        isError={false}
        isLoading={false}
        onBackToDashboard={onBackToDashboard}
        settingsOverview={settingsOverview}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Compte & Preferences' })).toBeInTheDocument();
    expect(screen.getByText('owner@example.com')).toBeInTheDocument();
    expect(screen.getByText('Lichess')).toBeInTheDocument();
    expect(screen.getAllByText('A preparer').length).toBeGreaterThan(0);
    expect(screen.getByText(/4 erreur\(s\) comme point de depart/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retour au tableau de bord' }));

    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });
});

describe('FuturePageView', () => {
  it('affiche un placeholder produit complet avec retour dashboard', () => {
    const onBackToDashboard = vi.fn();

    render(
      <FuturePageView
        ctaLabel='Retour aux entrainements'
        description='Prepare la future vue analytique globale.'
        eyebrow='Statistiques'
        onBackToDashboard={onBackToDashboard}
        points={['KPIs globaux', 'Courbes de progression']}
        title='Statistiques globales'
      />,
    );

    expect(screen.getByRole('heading', { name: 'Statistiques globales' })).toBeInTheDocument();
    expect(screen.getByText('Page encore en construction')).toBeInTheDocument();
    expect(screen.getByText('KPIs globaux')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retour aux entrainements' }));

    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });
});

describe('ImportView', () => {
  it('propose un retour au tableau de bord quand aucun training n est selectionne', () => {
    const onBackToDashboard = vi.fn();

    render(
      <ImportView
        csvErrors={[]}
        csvFileName=''
        csvRows={[]}
        isError={false}
        isPending={false}
        onBackToDashboard={onBackToDashboard}
        onFileParsed={vi.fn()}
        onResetFile={vi.fn()}
        onSubmit={vi.fn()}
        puzzleListIsLocked={false}
        selectedTraining={null}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Aucun training cible' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choisir un entraînement' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Choisir un entraînement' }));

    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });

  it('verrouille l import quand un cycle existe deja', () => {
    render(
      <ImportView
        csvErrors={['Ligne 4 : Ce puzzle apparait plusieurs fois dans le fichier.']}
        csvFileName='lichess.csv'
        csvRows={[
          {
            fen: null,
            personalNote: null,
            rating: 1500,
            solution: ['e2e4'],
            themes: ['fork'],
          },
        ]}
        isError={false}
        isPending={false}
        onBackToDashboard={vi.fn()}
        onFileParsed={vi.fn()}
        onResetFile={vi.fn()}
        onSubmit={vi.fn()}
        puzzleListIsLocked={true}
        selectedTraining={training}
      />,
    );

    expect(screen.getByText(/Import desactive/)).toBeInTheDocument();
    expect(screen.getByText(/Erreurs de validation/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importer 1 puzzle(s)' })).toBeDisabled();
    expect(screen.getByLabelText(/Glisse-depose ton fichier CSV ici/i)).toBeDisabled();
  });


  it('affiche un import pret et permet de lancer la soumission', () => {
    const onSubmit = vi.fn();

    render(
      <ImportView
        csvErrors={[]}
        csvFileName='lichess.csv'
        csvRows={[
          {
            fen: null,
            personalNote: 'Note utile',
            rating: 1500,
            solution: ['e2e4'],
            themes: ['fork'],
          },
          {
            fen: '8/8/8/8/8/8/8/8 w - - 0 1',
            personalNote: null,
            rating: null,
            solution: ['d2d4'],
            themes: [],
          },
        ]}
        isError={false}
        isPending={false}
        onBackToDashboard={vi.fn()}
        onFileParsed={vi.fn()}
        onResetFile={vi.fn()}
        onSubmit={onSubmit}
        puzzleListIsLocked={false}
        selectedTraining={training}
      />,
    );

    expect(screen.getByText('Import pret')).toBeInTheDocument();
    expect(screen.getByText('Le fichier est valide et pret a etre importe.')).toBeInTheDocument();
    expect(screen.getByText('lichess.csv')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importer 2 puzzle(s)' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Importer 2 puzzle(s)' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('garde l import en verification tant qu aucun puzzle valide n est pret', () => {
    render(
      <ImportView
        csvErrors={[]}
        csvFileName=''
        csvRows={[]}
        isError={false}
        isPending={false}
        onBackToDashboard={vi.fn()}
        onFileParsed={vi.fn()}
        onResetFile={vi.fn()}
        onSubmit={vi.fn()}
        puzzleListIsLocked={false}
        selectedTraining={training}
      />,
    );

    expect(screen.getByText('Verification en cours')).toBeInTheDocument();
    expect(screen.getByText(/Charge un CSV puis corrige les erreurs detectees/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importer 0 puzzle(s)' })).toBeDisabled();
  });

  it('affiche les erreurs de soumission et l etat pending pendant un import', () => {
    render(
      <ImportView
        csvErrors={[]}
        csvFileName='lichess.csv'
        csvRows={[
          {
            fen: null,
            personalNote: null,
            rating: 1500,
            solution: ['e2e4'],
            themes: ['fork'],
          },
        ]}
        errorMessage='Import backend indisponible.'
        isError={true}
        isPending={true}
        onBackToDashboard={vi.fn()}
        onFileParsed={vi.fn()}
        onResetFile={vi.fn()}
        onSubmit={vi.fn()}
        puzzleListIsLocked={false}
        selectedTraining={training}
      />,
    );

    expect(screen.getByText('Import backend indisponible.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import...' })).toBeDisabled();
  });
});
