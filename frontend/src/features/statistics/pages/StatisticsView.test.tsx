import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrainingsStatsView } from './StatisticsView';
import type { TrainingSummary } from '../../trainings/types/training.types';
import type { StatsOverview } from '../types/statistics.types';

const extraTrainingBreakdown = Array.from({ length: 5 }, (_, index) => ({
  training: {
    '@id': '/api/trainings/' + String(index + 2),
    createdAt: '2026-08-01T10:00:00+00:00',
    description: 'Extra',
    icon: 'queen',
    id: index + 2,
    name: 'Training ' + String(index + 2),
    status: 'active',
  },
  attemptCount: 2 + index,
  descriptionReady: true,
  durationMilliseconds: 120000 - index * 10000,
  failedCount: 1,
  hasResumableCycle: false,
  pendingCount: 0,
  progressPercent: 40 + index,
  puzzleCount: 4,
  rescuedCount: 0,
  resolvedPuzzleCount: 2,
  solvedCount: 1,
  successRate: 50,
  unresolvedCount: 1,
}));

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
    ...extraTrainingBreakdown,
  ],
  trainingCount: 6,
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
    {
      attemptCount: 3,
      averageAttempts: 1.1,
      completedPuzzleCount: 4,
      cycle: {
        '@id': '/api/cycles/1',
        completedAt: '2026-08-18T10:00:00+00:00',
        id: 1,
        number: 1,
        startedAt: '2026-08-17T10:00:00+00:00',
        status: 'completed',
        training: '/api/trainings/1',
      },
      durationMilliseconds: 60000,
      failed: 1,
      pending: 0,
      progressPercent: 100,
      puzzlesWithCompletedAttemptsCount: 4,
      rescuedCount: 0,
      solved: 3,
      successRate: 75,
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

    expect(screen.getByText('Entraînements les plus actifs')).toBeInTheDocument();
    expect(screen.getByText('Difficulté moy.')).toBeInTheDocument();
    expect(screen.getByText('Répartition du temps par training')).toBeInTheDocument();
    expect(screen.getByText('Répartition des résultats')).toBeInTheDocument();
    expect(screen.queryByText('Temps investi / progression obtenue')).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: '7 derniers jours' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '90 derniers jours' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voir tout' })).toBeInTheDocument();
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
    expect(screen.getByRole('option', { name: "Temps d'entraînement" })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Progression' })).not.toBeInTheDocument();
    expect(screen.queryByText('Delta')).not.toBeInTheDocument();
  });

  it('affiche les cycles dans l ordre chronologique et ouvre la repartition complete', () => {
    const { container } = render(
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

    const chart = container.querySelector('svg[aria-label="Taux de réussite"]');
    expect(chart).not.toBeNull();
    const chartText = chart?.textContent ?? '';
    expect(chartText.indexOf('Cycle 1')).toBeLessThan(chartText.indexOf('Cycle 3'));
  });

  it('ouvre le voir tout de la repartition du temps par training', () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Voir tout' }));

    expect(screen.getAllByRole('heading', { name: 'Répartition du temps par training' }).length).toBeGreaterThan(1);
  });
});

