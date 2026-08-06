import { useEffect, useState } from 'react';

export type AppRoute =
  | { name: 'auth' }
  | { name: 'dashboard' }
  | { name: 'create-training' }
  | { name: 'training-detail'; trainingId?: number }
  | { name: 'training-import'; trainingId?: number }
  | { name: 'training-solver'; trainingId?: number };

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    function handlePopState() {
      setRoute(parseRoute(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(nextRoute: AppRoute, options?: { replace?: boolean }) {
    const nextPath = buildPath(nextRoute);

    if (nextPath === window.location.pathname) {
      setRoute(nextRoute);
      return;
    }

    if (options?.replace) {
      window.history.replaceState(null, '', nextPath);
    } else {
      window.history.pushState(null, '', nextPath);
    }

    setRoute(nextRoute);
  }

  return {
    navigate,
    route,
  };
}

export function buildPath(route: AppRoute): string {
  switch (route.name) {
    case 'auth':
      return '/auth';
    case 'dashboard':
      return '/dashboard';
    case 'create-training':
      return '/trainings/new';
    case 'training-detail':
      return route.trainingId ? `/trainings/${route.trainingId}` : '/trainings';
    case 'training-import':
      return route.trainingId ? `/trainings/${route.trainingId}/import` : '/import';
    case 'training-solver':
      return route.trainingId ? `/trainings/${route.trainingId}/solver` : '/solver';
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
      return 'Tableau de bord';
    case 'create-training':
      return 'Creer un entrainement';
    case 'training-detail':
      return 'Detail training';
    case 'training-import':
      return 'Import CSV';
    case 'training-solver':
      return 'Solveur';
  }
}

export function getRouteDocumentTitle(route: AppRoute): string {
  return `${getRouteLabel(route)} | Woodpecker Trainer`;
}

function parseRoute(pathname: string): AppRoute {
  const path = normalizePath(pathname);
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0 || segments[0] === 'dashboard') {
    return { name: 'dashboard' };
  }

  if (segments[0] === 'auth') {
    return { name: 'auth' };
  }

  if (segments[0] === 'import') {
    return { name: 'training-import' };
  }

  if (segments[0] === 'solver') {
    return { name: 'training-solver' };
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

  if (segments[2] === 'import') {
    return { name: 'training-import', trainingId };
  }

  if (segments[2] === 'solver') {
    return { name: 'training-solver', trainingId };
  }

  return { name: 'training-detail', trainingId };
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function parseTrainingId(segment?: string): number | undefined {
  if (!segment) {
    return undefined;
  }

  const parsed = Number(segment);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}
