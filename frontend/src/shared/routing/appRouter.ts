import { useEffect, useState } from 'react';

export type AppRoute =
  | { name: 'not-found'; path: string }
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
    case 'not-found': return normalizedRoute.path;
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
    case 'not-found': return 'Page introuvable';
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
  const simple: Record<string, AppRoute> = {
    '/': { name: 'dashboard' }, '/dashboard': { name: 'dashboard' }, '/auth': { name: 'auth' },
    '/stats': { name: 'stats-overview' }, '/history': { name: 'history-detail' }, '/settings': { name: 'user-settings' },
    '/trainings': { name: 'training-detail' }, '/trainings/new': { name: 'create-training' },
    '/import': { name: 'training-detail' }, '/solver': { name: 'training-detail' },
  };
  if (simple[path]) return simple[path];
  const match = path.match(/^\/trainings\/([1-9]\d*)(?:\/(edit|import|solver))?$/);
  if (match && Number.isSafeInteger(Number(match[1]))) {
    const names = { edit: 'training-edit', import: 'training-import', solver: 'training-solver' } as const;
    return { name: match[2] ? names[match[2] as keyof typeof names] : 'training-detail', trainingId: Number(match[1]) };
  }
  return { name: 'not-found', path };
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}
