import { useEffect, useState } from 'react';

export type AppRoute =
  | { name: 'auth' }
  | { name: 'dashboard' }
  | { name: 'create-training' }
  | { name: 'training-edit'; trainingId?: number }
  | { name: 'training-detail'; trainingId?: number }
  | { name: 'training-import'; trainingId?: number }
  | { name: 'training-solver'; trainingId?: number }
  | { name: 'stats-overview' }
  | { name: 'history-detail' }
  | { name: 'user-settings' };

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    syncWindowScroll();

    function handlePopState() {
      setRoute(parseRoute(window.location.pathname));
      syncWindowScroll();
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(nextRoute: AppRoute, options: { replace?: boolean } = {}) {
    const normalizedRoute = normalizeRoute(nextRoute);
    const nextPath = buildPath(normalizedRoute);

    if (nextPath === window.location.pathname) {
      setRoute(normalizedRoute);
      syncWindowScroll();
      return;
    }

    if (options.replace) {
      window.history.replaceState(null, '', nextPath);
    } else {
      window.history.pushState(null, '', nextPath);
    }

    setRoute(normalizedRoute);
    syncWindowScroll();
  }

  return {
    navigate,
    route,
  };
}

function syncWindowScroll() {
  if (typeof window === 'undefined') {
    return;
  }

  const reset = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  reset();
  window.requestAnimationFrame(reset);
  window.setTimeout(reset, 0);
}

export function buildPath(route: AppRoute): string {
  const normalizedRoute = normalizeRoute(route);

  switch (normalizedRoute.name) {
    case 'auth':
      return '/auth';
    case 'dashboard':
      return '/dashboard';
    case 'create-training':
      return '/trainings/new';
    case 'training-edit':
      return normalizedRoute.trainingId ? `/trainings/${normalizedRoute.trainingId}/edit` : '/trainings';
    case 'training-detail':
      return normalizedRoute.trainingId ? `/trainings/${normalizedRoute.trainingId}` : '/trainings';
    case 'training-import':
      return normalizedRoute.trainingId ? `/trainings/${normalizedRoute.trainingId}/import` : '/trainings';
    case 'training-solver':
      return normalizedRoute.trainingId ? `/trainings/${normalizedRoute.trainingId}/solver` : '/trainings';
    case 'stats-overview':
      return '/stats';
    case 'history-detail':
      return '/history';
    case 'user-settings':
      return '/settings';
  }
}

export function routesEqual(left: AppRoute, right: AppRoute): boolean {
  return buildPath(left) === buildPath(right);
}

export function getRouteLabel(route: AppRoute): string {
  switch (route.name) {
    case 'auth':
      return 'Connexion';
    case 'dashboard':
      return 'Mes entraînements';
    case 'create-training':
      return 'Créer un entraînement';
    case 'training-detail':
      return 'Détail training';
    case 'training-edit':
      return "Modifier l'entraînement";
    case 'training-import':
      return 'Importer des puzzles';
    case 'training-solver':
      return 'Solveur';
    case 'stats-overview':
      return 'Statistiques globales';
    case 'history-detail':
      return 'Historique';
    case 'user-settings':
      return 'Compte & Préférences';
  }
}

export function getRouteDocumentTitle(route: AppRoute): string {
  return `${getRouteLabel(route)} | Woodpecker Trainer`;
}

export function normalizeRoute(route: AppRoute): AppRoute {
  if ((route.name === 'training-import' || route.name === 'training-solver' || route.name === 'training-edit') && !route.trainingId) {
    return { name: 'training-detail' };
  }

  return route;
}

export function parseRoute(pathname: string): AppRoute {
  const path = normalizePath(pathname);
  const segments = path.split('/').filter(Boolean);


  if (segments.length === 0 || segments[0] === 'dashboard') {
    return { name: 'dashboard' };
  }

  if (segments[0] === 'auth') {
    return { name: 'auth' };
  }

  if (segments[0] === 'stats') {
    return { name: 'stats-overview' };
  }

  if (segments[0] === 'history') {
    return { name: 'history-detail' };
  }

  if (segments[0] === 'settings') {
    return { name: 'user-settings' };
  }

  if (segments[0] === 'import' || segments[0] === 'solver') {
    return { name: 'training-detail' };
  }

  if (segments[0] !== 'trainings') {
    return { name: 'dashboard' };
  }

  if (segments[1] === 'new') {
    return { name: 'create-training' };
  }

  const trainingId = parseTrainingId(segments[1]);

  if (!segments[1]) {
    return { name: 'training-detail' };
  }

  if (segments[2] === 'edit') {
    return normalizeRoute({ name: 'training-edit', trainingId });
  }

  if (segments[2] === 'import') {
    return normalizeRoute({ name: 'training-import', trainingId });
  }

  if (segments[2] === 'solver') {
    return normalizeRoute({ name: 'training-solver', trainingId });
  }

  return { name: 'training-detail', trainingId };
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function parseTrainingId(segment: string): number | undefined {
  if (!segment) {
    return undefined;
  }

  const parsed = Number(segment);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}




