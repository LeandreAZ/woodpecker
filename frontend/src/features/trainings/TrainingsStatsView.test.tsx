import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrainingsStatsView } from './TrainingsStatsView';
import type { StatsOverview, TrainingSummary } from './trainingsTypes';

const statsOverview: StatsOverview = {
  activeCycleCount: 1,
  attemptCount: 14,
  averageAttempts: 1.4,
  averageMistakes: 1.1,
  completedCycleCount: 2,
  failedCyclePuzzleCount: 3,
  latestAttemptedAt: '2026-08-27T12:00:00+00:00',
  pendingCyclePuzzleCount: 5,
  progressPercent: 60,
  puzzleCount: 10,
  rescuedCyclePuzzleCount: 2,
  resumableTrainingCount: 1,
  solvedCyclePuzzleCount: 4,
  successRate: 57,
  successfulAttemptCount: 6,
  totalDurationMilliseconds: 780000,
  trainingBreakdown: [
    {
      training: {
        '@id': '/api/trainings/1',
        createdAt: '2026-08-01T10:00:00+00:00',
        description: 'Mat',
        icon: 'queen',
        id: 1,
        name: 'Mat',
        status: 'active',
      },
      attemptCount: 8,
      descriptionReady: true,
      durationMilliseconds: 420000,
      failedCount: 2,
      hasResumableCycle: true,
      pendingCount: 3,
      progressPercent: 70,
      puzzleCount: 5,
      rescuedCount: 1,
      resolvedPuzzleCount: 4,
      solvedCount: 3,
      successRate: 60,
      unresolvedCount: 1,
    },
  ],
  trainingCount: 1,
  unresolvedCyclePuzzleCount: 1,
};

const summary: TrainingSummary = {
  attemptCount: 9,
  attemptCountDistribution: {
    fourPlusAttemptCount: 1,
    oneAttemptCount: 1,
    resolvedPuzzleCount: 4,
    threeAttemptCount: 1,
    twoAttemptCount: 1,
  },
  averageMistakes: 1.2,
  cycleSummaries: [
    {
      attemptCount: 4,
      averageAttempts: 1.3,
      completedPuzzleCount: 3,
      cycle: {
        '@id': '/api/cycles/3',
        completedAt: null,
        id: 3,
        number: 3,
        startedAt: '2026-08-26T10:00:00+00:00',
        status: 'active',
        training: '/api/trainings/1',
      },
      durationMilliseconds: 180000,
      failed: 2,
      pending: 1,
      progressPercent: 75,
      puzzlesWithCompletedAttemptsCount: 3,
      rescuedCount: 1,
      solved: 2,
      successRate: 50,
      total: 4,
      unresolvedCount: 1,
    },
  ],
  latestAttempts: [],
  latestCycleSummary: null,
  notedPuzzleCount: 0,
  puzzleCount: 5,
  ratedPuzzleCount: 3,
  solvedAttemptCount: 4,
  themedPuzzleCount: 2,
};

describe('TrainingsStatsView', () => {
  it('affiche les blocs globaux attendus', () => {
    render(
      <TrainingsStatsView
        isError={false}
        isLoading={false}
        onOpenTraining={vi.fn()}
        onSelectTrainingIri={vi.fn()}
        selectedTrainingIri={null}
        statsOverview={statsOverview}
        summary={null}
        summaryIsError={false}
        summaryIsLoading={false}
      />,
    );

    expect(screen.getByText('Trainings les plus actifs')).toBeInTheDocument();
    expect(screen.getByText('Difficulté moy.')).toBeInTheDocument();
    expect(screen.getByText('Répartition du temps par training')).toBeInTheDocument();
    expect(screen.getByText('Répartition des résultats')).toBeInTheDocument();
    expect(screen.queryByText('Temps investi / progression obtenue')).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: '7 derniers jours' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '90 derniers jours' })).toBeInTheDocument();
  });

  it('affiche les blocs détaillés attendus pour un training', () => {
    render(
      <TrainingsStatsView
        isError={false}
        isLoading={false}
        onOpenTraining={vi.fn()}
        onSelectTrainingIri={vi.fn()}
        selectedTrainingIri="/api/trainings/1"
        statsOverview={statsOverview}
        summary={summary}
        summaryIsError={false}
        summaryIsLoading={false}
      />,
    );

    expect(screen.getByText('Évolution des cycles')).toBeInTheDocument();
    expect(screen.getByText('Répartition des résultats par cycle')).toBeInTheDocument();
    expect(screen.getByText("Distribution du nombre d'essais")).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Taux de réussite' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tentatives moyennes' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Progression' })).not.toBeInTheDocument();
    expect(screen.queryByText('Delta')).not.toBeInTheDocument();
  });
});

