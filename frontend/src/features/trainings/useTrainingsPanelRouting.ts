import { useEffect, useLayoutEffect, useRef } from 'react';
import type { AppRoute } from '../../shared/routing/appRouter';
import { normalizeRoute, routesEqual } from '../../shared/routing/appRouter';
import { flushSolverNavigationSnapshot } from './solverPersistence';
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
  setSavedCyclePuzzleIris: (value: Set<string>) => void;
  setSelectedTrainingIri: (value: string | null) => void;
  setSelectedTrainingPuzzleIri: (value: string | null) => void;
  trainings: Training[];
  trainingsArePending: boolean;
};

function useTrainingsPanelRouting({
  activeView,
  effectiveSelectedTrainingIri,
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
}: UseTrainingsPanelRoutingArgs) {
  const targetView = viewFromRoute(route);
  const desiredRoute = normalizeRoute(buildRouteFromState(activeView, selectedTraining));
  const routeKey = buildPathKey(route);
  const previousRouteKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const routeDidChange = previousRouteKeyRef.current !== routeKey;
    previousRouteKeyRef.current = routeKey;

    if (routeDidChange && activeView !== targetView) {
      setActiveView(targetView);
    }
  }, [activeView, routeKey, setActiveView, targetView]);

  useEffect(() => {
    const routeTrainingId = getRouteTrainingId(route);
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
  }, [
    effectiveSelectedTrainingIri,
    route,
    setActiveCycleIri,
    setActiveTrainingSessionIri,
    setFailedCyclePuzzleIris,
    setSavedCyclePuzzleIris,
    setSelectedTrainingIri,
    setSelectedTrainingPuzzleIri,
    trainings,
  ]);

  useEffect(() => {
    const routeTrainingId = getRouteTrainingId(route);
    const routeTrainingExists = routeTrainingId
      ? trainings.some((training) => training.id === routeTrainingId)
      : true;

    if (routeTrainingId && !routeTrainingExists && trainingsArePending) {
      return;
    }

    if (!routeTrainingExists) {
      onNavigate(desiredRoute, { replace: true });
      return;
    }

    if (routeTrainingId && selectedTraining && selectedTraining.id !== routeTrainingId) {
      return;
    }

    if (!routesEqual(route, desiredRoute)) {
      onNavigate(desiredRoute, { replace: true });
    }
  }, [desiredRoute, onNavigate, route, selectedTraining, trainings, trainingsArePending]);

  function navigateToView(nextView: View) {
    flushSolverNavigationSnapshot();
    setActiveView(nextView);
    onNavigate(normalizeRoute(buildRouteFromState(nextView, selectedTraining)));
  }

  function navigateToTraining(
    trainingIri: string,
    openTraining: (value: string, view?: View) => void,
    view: View = 'detail',
  ) {
    flushSolverNavigationSnapshot();
    openTraining(trainingIri, view);

    const training = trainings.find((item) => item['@id'] === trainingIri) ?? null;
    onNavigate(normalizeRoute(buildRouteFromState(view, training)));
  }

  function navigateToPuzzleSolver(trainingPuzzleIri: string) {
    flushSolverNavigationSnapshot();
    setSelectedTrainingPuzzleIri(trainingPuzzleIri);
    setActiveView('solver');
    onNavigate(normalizeRoute(buildRouteFromState('solver', selectedTraining)));
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
    case 'training-edit':
      return 'edit';
    case 'stats-overview':
      return 'stats';
    case 'history-detail':
      return 'history';
    case 'user-settings':
      return 'settings';
    case 'auth':
      return 'dashboard';
    default:
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
    case 'edit':
      return { name: 'training-edit', trainingId };
    case 'stats':
      return { name: 'stats-overview' };
    case 'history':
      return { name: 'history-detail' };
    case 'settings':
      return { name: 'user-settings' };
  }
}

function buildPathKey(route: AppRoute): string {
  return JSON.stringify(normalizeRoute(route));
}

function getRouteTrainingId(route: AppRoute): number | undefined {
  if ('trainingId' in route) {
    return route.trainingId;
  }

  return undefined;
}

export { useTrainingsPanelRouting };
export default useTrainingsPanelRouting;


