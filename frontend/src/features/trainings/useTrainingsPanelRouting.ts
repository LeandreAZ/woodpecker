import { useEffect, useLayoutEffect } from 'react';
import type { AppRoute } from '../../shared/routing/appRouter';
import { routesEqual } from '../../shared/routing/appRouter';
import type { Training, View } from './trainingsTypes';

type UseTrainingsPanelRoutingArgs = {
  activeView: View;
  effectiveSelectedTrainingIri: string | null;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  route: AppRoute;
  selectedTraining: Training | null;
  setActiveCycleIri: (value: string | null) => void;
  setActiveTrainingSessionIri: (value: string | null) => void;
  setActiveView: (value: View) => void;
  setFailedCyclePuzzleIris: (value: Set<string>) => void;
  setMistakeLimitOverride: (value: number | null) => void;
  setSavedCyclePuzzleIris: (value: Set<string>) => void;
  setSelectedTrainingIri: (value: string | null) => void;
  setSelectedTrainingPuzzleIri: (value: string | null) => void;
  trainings: Training[];
  trainingsArePending: boolean;
};

export function useTrainingsPanelRouting({
  activeView,
  effectiveSelectedTrainingIri,
  onNavigate,
  route,
  selectedTraining,
  setActiveCycleIri,
  setActiveTrainingSessionIri,
  setActiveView,
  setFailedCyclePuzzleIris,
  setMistakeLimitOverride,
  setSavedCyclePuzzleIris,
  setSelectedTrainingIri,
  setSelectedTrainingPuzzleIri,
  trainings,
  trainingsArePending,
}: UseTrainingsPanelRoutingArgs) {
  const targetView = viewFromRoute(route);
  const desiredRoute = buildRouteFromState(activeView, selectedTraining);

  useLayoutEffect(() => {
    const routeTrainingId = getRouteTrainingId(route);

    if (activeView !== targetView) {
      setActiveView(targetView);
    }

    if (!routeTrainingId) {
      return;
    }

    const matchingTraining = trainings.find((training) => training.id === routeTrainingId);

    if (!matchingTraining || matchingTraining['@id'] === effectiveSelectedTrainingIri) {
      return;
    }

    setSelectedTrainingIri(matchingTraining['@id']);
    setSelectedTrainingPuzzleIri(null);
    setActiveCycleIri(null);
    setActiveTrainingSessionIri(null);
    setSavedCyclePuzzleIris(new Set());
    setFailedCyclePuzzleIris(new Set());
    setMistakeLimitOverride(null);
  }, [
    activeView,
    effectiveSelectedTrainingIri,
    route,
    setActiveCycleIri,
    setActiveTrainingSessionIri,
    setActiveView,
    setFailedCyclePuzzleIris,
    setMistakeLimitOverride,
    setSavedCyclePuzzleIris,
    setSelectedTrainingIri,
    setSelectedTrainingPuzzleIri,
    targetView,
    trainings,
  ]);

  useEffect(() => {
    const routeTrainingId = getRouteTrainingId(route);

    if (routeTrainingId && !selectedTraining && trainingsArePending) {
      return;
    }

    if (routeTrainingId && selectedTraining && selectedTraining.id !== routeTrainingId) {
      return;
    }

    if (!routesEqual(route, desiredRoute)) {
      onNavigate(desiredRoute, { replace: true });
    }
  }, [desiredRoute, onNavigate, route, selectedTraining, trainingsArePending]);

  function navigateToView(nextView: View) {
    setActiveView(nextView);
    onNavigate(buildRouteFromState(nextView, selectedTraining));
  }

  function navigateToTraining(
    trainingIri: string,
    openTraining: (value: string, view?: View) => void,
    view: View = 'detail',
  ) {
    openTraining(trainingIri, view);

    const training = trainings.find((item) => item['@id'] === trainingIri) ?? null;
    onNavigate(buildRouteFromState(view, training));
  }

  function navigateToPuzzleSolver(trainingPuzzleIri: string) {
    setSelectedTrainingPuzzleIri(trainingPuzzleIri);
    setActiveView('solver');
    onNavigate(buildRouteFromState('solver', selectedTraining));
  }

  return {
    navigateToPuzzleSolver,
    navigateToTraining,
    navigateToView,
  };
}

function viewFromRoute(route: AppRoute): View {
  switch (route.name) {
    case 'dashboard':
      return 'dashboard';
    case 'create-training':
      return 'create';
    case 'training-import':
      return 'import';
    case 'training-solver':
      return 'solver';
    case 'training-detail':
      return 'detail';
    case 'auth':
      return 'dashboard';
  }
}

function buildRouteFromState(activeView: View, selectedTraining: Training | null): AppRoute {
  const trainingId = selectedTraining?.id;

  switch (activeView) {
    case 'dashboard':
      return { name: 'dashboard' };
    case 'create':
      return { name: 'create-training' };
    case 'import':
      return { name: 'training-import', trainingId };
    case 'solver':
      return { name: 'training-solver', trainingId };
    case 'detail':
      return { name: 'training-detail', trainingId };
  }
}

function getRouteTrainingId(route: AppRoute): number | undefined {
  if ('trainingId' in route) {
    return route.trainingId;
  }

  return undefined;
}
