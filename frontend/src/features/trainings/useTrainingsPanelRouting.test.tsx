import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTrainingsPanelRouting } from './useTrainingsPanelRouting';
import type { Training, View } from './trainingsTypes';
import type { AppRoute } from '../../shared/routing/appRouter';

const trainingOne: Training = {
  '@id': '/api/trainings/1',
  createdAt: '2026-08-06T18:10:00+00:00',
  description: 'Premier set',
  icon: 'queen',
  iconBackgroundColor: '#7C5CFF',
  iconColor: '#FFFFFF',
  id: 1,
  mistakeLimit: 3,
  name: 'Mate en 2',
  status: 'draft',
};

const trainingTwo: Training = {
  '@id': '/api/trainings/2',
  createdAt: '2026-08-07T18:10:00+00:00',
  description: 'Deuxieme set',
  icon: 'rook',
  iconBackgroundColor: '#2563EB',
  iconColor: '#FFFFFF',
  id: 2,
  mistakeLimit: 3,
  name: 'Tactiques mixtes',
  status: 'draft',
};

type RoutingHarnessProps = {
  activeView: View;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  route: AppRoute;
  selectedTraining: Training | null;
  trainings: Training[];
  trainingsArePending?: boolean;
  setActiveCycleIri?: (value: string | null) => void;
  setActiveTrainingSessionIri?: (value: string | null) => void;
  setActiveView?: (value: View) => void;
  setFailedCyclePuzzleIris?: (value: Set<string>) => void;
  setSavedCyclePuzzleIris?: (value: Set<string>) => void;
  setSelectedTrainingIri?: (value: string | null) => void;
  setSelectedTrainingPuzzleIri?: (value: string | null) => void;
  onReady?: (actions: ReturnType<typeof useTrainingsPanelRouting>) => void;
};

function RoutingHarness({
  activeView,
  onNavigate,
  route,
  selectedTraining,
  trainings,
  trainingsArePending = false,
  setActiveCycleIri = vi.fn(),
  setActiveTrainingSessionIri = vi.fn(),
  setActiveView = vi.fn(),
  setFailedCyclePuzzleIris = vi.fn(),
  setSavedCyclePuzzleIris = vi.fn(),
  setSelectedTrainingIri = vi.fn(),
  setSelectedTrainingPuzzleIri = vi.fn(),
  onReady,
}: RoutingHarnessProps) {
  const actions = useTrainingsPanelRouting({
    activeView,
    effectiveSelectedTrainingIri: selectedTraining?.['@id'] ?? null,
    onNavigate,
    route,
    selectedTraining,
    setActiveCycleIri,
    setActiveTrainingSessionIri,
    setActiveView,
    setFailedCyclePuzzleIris,
    setSavedCyclePuzzleIris,
    setSelectedTrainingIri,
    setSelectedTrainingPuzzleIri,
    trainings,
    trainingsArePending,
  });

  onReady?.(actions);

  return null;
}

describe('useTrainingsPanelRouting', () => {
  it('recanonise une route detail avec training introuvable vers le training effectivement selectionne', async () => {
    const onNavigate = vi.fn();

    render(
      <RoutingHarness
        activeView="detail"
        onNavigate={onNavigate}
        route={{ name: 'training-detail', trainingId: 99 }}
        selectedTraining={trainingOne}
        trainings={[trainingOne, trainingTwo]}
      />,
    );

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith({ name: 'training-detail', trainingId: 1 }, { replace: true });
    });
  });

  it('attend la fin du chargement avant de corriger une route introuvable', async () => {
    const onNavigate = vi.fn();

    render(
      <RoutingHarness
        activeView="detail"
        onNavigate={onNavigate}
        route={{ name: 'training-detail', trainingId: 99 }}
        selectedTraining={null}
        trainings={[]}
        trainingsArePending={true}
      />,
    );

    await waitFor(() => {
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  it('recanonise une navigation solveur orpheline vers le detail si aucun training n est disponible', async () => {
    const onNavigate = vi.fn();

    render(
      <RoutingHarness
        activeView="solver"
        onNavigate={onNavigate}
        route={{ name: 'training-solver', trainingId: 99 }}
        selectedTraining={null}
        trainings={[]}
      />,
    );

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith({ name: 'training-detail' }, { replace: true });
    });
  });

  it('synchronise le state local quand la route pointe vers un autre training existant', async () => {
    const setSelectedTrainingIri = vi.fn();
    const setSelectedTrainingPuzzleIri = vi.fn();
    const setActiveCycleIri = vi.fn();
    const setActiveTrainingSessionIri = vi.fn();
    const setSavedCyclePuzzleIris = vi.fn();
    const setFailedCyclePuzzleIris = vi.fn();

    render(
      <RoutingHarness
        activeView="detail"
        onNavigate={vi.fn()}
        route={{ name: 'training-detail', trainingId: 2 }}
        selectedTraining={trainingOne}
        setActiveCycleIri={setActiveCycleIri}
        setActiveTrainingSessionIri={setActiveTrainingSessionIri}
        setFailedCyclePuzzleIris={setFailedCyclePuzzleIris}
        setSavedCyclePuzzleIris={setSavedCyclePuzzleIris}
        setSelectedTrainingIri={setSelectedTrainingIri}
        setSelectedTrainingPuzzleIri={setSelectedTrainingPuzzleIri}
        trainings={[trainingOne, trainingTwo]}
      />,
    );

    await waitFor(() => {
      expect(setSelectedTrainingIri).toHaveBeenCalledWith('/api/trainings/2');
      expect(setSelectedTrainingPuzzleIri).toHaveBeenCalledWith(null);
      expect(setActiveCycleIri).toHaveBeenCalledWith(null);
      expect(setActiveTrainingSessionIri).toHaveBeenCalledWith(null);
      expect(setSavedCyclePuzzleIris).toHaveBeenCalledWith(new Set());
      expect(setFailedCyclePuzzleIris).toHaveBeenCalledWith(new Set());
    });
  });

  it('navigue vers une vue globale sans training quand on demande une autre section', async () => {
    const onNavigate = vi.fn();
    const setActiveView = vi.fn();
    let actions: ReturnType<typeof useTrainingsPanelRouting> | null = null;

    render(
      <RoutingHarness
        activeView="dashboard"
        onNavigate={onNavigate}
        onReady={(value) => {
          actions = value;
        }}
        route={{ name: 'dashboard' }}
        selectedTraining={trainingOne}
        setActiveView={setActiveView}
        trainings={[trainingOne, trainingTwo]}
      />,
    );

    await waitFor(() => {
      expect(actions).not.toBeNull();
    });

    act(() => {
      actions?.navigateToView('history');
    });

    expect(setActiveView).toHaveBeenCalledWith('history');
    expect(onNavigate).toHaveBeenCalledWith({ name: 'history-detail' });
  });

  it('navigue vers le training cible et la bonne vue quand on ouvre un training', async () => {
    const onNavigate = vi.fn();
    const openTraining = vi.fn();
    let actions: ReturnType<typeof useTrainingsPanelRouting> | null = null;

    render(
      <RoutingHarness
        activeView="dashboard"
        onNavigate={onNavigate}
        onReady={(value) => {
          actions = value;
        }}
        route={{ name: 'dashboard' }}
        selectedTraining={trainingOne}
        trainings={[trainingOne, trainingTwo]}
      />,
    );

    await waitFor(() => {
      expect(actions).not.toBeNull();
    });

    act(() => {
      actions?.navigateToTraining('/api/trainings/2', openTraining, 'solver');
    });

    expect(openTraining).toHaveBeenCalledWith('/api/trainings/2', 'solver');
    expect(onNavigate).toHaveBeenCalledWith({ name: 'training-solver', trainingId: 2 });
  });

  it('force le passage au solveur et conserve le training courant quand on choisit un puzzle', async () => {
    const onNavigate = vi.fn();
    const setActiveView = vi.fn();
    const setSelectedTrainingPuzzleIri = vi.fn();
    let actions: ReturnType<typeof useTrainingsPanelRouting> | null = null;

    render(
      <RoutingHarness
        activeView="detail"
        onNavigate={onNavigate}
        onReady={(value) => {
          actions = value;
        }}
        route={{ name: 'training-detail', trainingId: 1 }}
        selectedTraining={trainingOne}
        setActiveView={setActiveView}
        setSelectedTrainingPuzzleIri={setSelectedTrainingPuzzleIri}
        trainings={[trainingOne, trainingTwo]}
      />,
    );

    await waitFor(() => {
      expect(actions).not.toBeNull();
    });

    act(() => {
      actions?.navigateToPuzzleSolver('/api/training_puzzles/7');
    });

    expect(setSelectedTrainingPuzzleIri).toHaveBeenCalledWith('/api/training_puzzles/7');
    expect(setActiveView).toHaveBeenCalledWith('solver');
    expect(onNavigate).toHaveBeenCalledWith({ name: 'training-solver', trainingId: 1 });
  });
});
