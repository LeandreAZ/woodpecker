import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardView } from './TrainingsPanelViews';
import type { Training, TrainingDashboardSummary } from './trainingsTypes';

const training: Training = {
  '@id': '/api/trainings/1',
  createdAt: '2026-08-06T18:10:00+00:00',
  description: 'Set tactique',
  id: 1,
  mistakeLimit: 3,
  name: 'Mate en 2',
  status: 'draft',
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
});
