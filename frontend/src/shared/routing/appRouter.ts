import { useEffect, useState } from 'react';

export type AppRoute =
  | { name: 'auth' }
  | { name: 'dashboard' }
  | { name: 'create-training' }
  | { name: 'training-detail'; trainingId?: number }
  | { name: 'training-import'; trainingId?: number }
  | { name: 'training-solver'; trainingId?: number }
  | { name: 'stats-overview' }
  | { name: 'history-detail' }
  | { name: 'user-settings' }
  | { name: 'compare-auth' }
  | { name: 'compare-dashboard' }
  | { name: 'compare-create-training' }
  | { name: 'compare-detail' }
  | { name: 'compare-solver' }
  | { name: 'compare-stats' }
  | { name: 'compare-history' }
  | { name: 'compare-import' }
  | { name: 'compare-settings' }
  | { name: 'compare-library' }
  | { name: 'compare-integrations' }
  | { name: 'compare-planning' }
  | { name: 'compare-dashboard-advanced' }
  | { name: 'compare-modal-error' }
  | { name: 'compare-modal-confirmation' }
  | { name: 'compare-empty-state' }
  | { name: 'compare-loading-state' }
  | { name: 'compare-dashboard-mobile' }
  | { name: 'compare-create-training-mobile' }
  | { name: 'compare-detail-mobile' }
  | { name: 'compare-solver-mobile' }
  | { name: 'compare-stats-mobile' }
  | { name: 'compare-settings-mobile' }
  | { name: 'compare-integrations-mobile' }
  | { name: 'compare-modal-error-mobile' }
  | { name: 'compare-modal-import-error-mobile' }
  | { name: 'compare-modal-confirmation-mobile' }
  | { name: 'compare-empty-state-mobile' }
  | { name: 'compare-loading-state-mobile' };

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
    case 'compare-auth':
      return '/compare/auth';
    case 'compare-dashboard':
      return '/compare/dashboard';
    case 'compare-create-training':
      return '/compare/create-training';
    case 'compare-detail':
      return '/compare/detail';
    case 'compare-solver':
      return '/compare/solver';
    case 'compare-stats':
      return '/compare/stats';
    case 'compare-history':
      return '/compare/history';
    case 'compare-import':
      return '/compare/import';
    case 'compare-settings':
      return '/compare/settings';
    case 'compare-library':
      return '/compare/library';
    case 'compare-integrations':
      return '/compare/integrations';
    case 'compare-planning':
      return '/compare/planning';
    case 'compare-dashboard-advanced':
      return '/compare/dashboard-advanced';
    case 'compare-modal-error':
      return '/compare/modal-error';
    case 'compare-modal-confirmation':
      return '/compare/modal-confirmation';
    case 'compare-empty-state':
      return '/compare/empty-state';
    case 'compare-loading-state':
      return '/compare/loading-state';
    case 'compare-dashboard-mobile':
      return '/compare/mobile/dashboard';
    case 'compare-create-training-mobile':
      return '/compare/mobile/create-training';
    case 'compare-detail-mobile':
      return '/compare/mobile/detail';
    case 'compare-solver-mobile':
      return '/compare/mobile/solver';
    case 'compare-stats-mobile':
      return '/compare/mobile/stats';
    case 'compare-settings-mobile':
      return '/compare/mobile/settings';
    case 'compare-integrations-mobile':
      return '/compare/mobile/integrations';
    case 'compare-modal-error-mobile':
      return '/compare/mobile/modal-error';
    case 'compare-modal-import-error-mobile':
      return '/compare/mobile/modal-import-error';
    case 'compare-modal-confirmation-mobile':
      return '/compare/mobile/modal-confirmation';
    case 'compare-empty-state-mobile':
      return '/compare/mobile/empty-state';
    case 'compare-loading-state-mobile':
      return '/compare/mobile/loading-state';
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
    case 'compare-auth':
      return 'Comparaison auth';
    case 'compare-dashboard':
      return 'Comparaison dashboard';
    case 'compare-create-training':
      return 'Comparaison création';
    case 'compare-detail':
      return 'Comparaison détail';
    case 'compare-solver':
      return 'Comparaison solveur';
    case 'compare-stats':
      return 'Comparaison stats';
    case 'compare-history':
      return 'Comparaison historique';
    case 'compare-import':
      return 'Comparaison import';
    case 'compare-settings':
      return 'Comparaison paramètres';
    case 'compare-library':
      return 'Comparaison bibliothèque';
    case 'compare-integrations':
      return 'Comparaison intégrations';
    case 'compare-planning':
      return 'Comparaison planning';
    case 'compare-dashboard-advanced':
      return 'Comparaison dashboard avancé';
    case 'compare-modal-error':
      return 'Comparaison modal erreur';
    case 'compare-modal-confirmation':
      return 'Comparaison modal confirmation';
    case 'compare-empty-state':
      return 'Comparaison état vide';
    case 'compare-loading-state':
      return 'Comparaison chargement';
    case 'compare-dashboard-mobile':
      return 'Comparaison dashboard mobile';
    case 'compare-create-training-mobile':
      return 'Comparaison création mobile';
    case 'compare-detail-mobile':
      return 'Comparaison détail mobile';
    case 'compare-solver-mobile':
      return 'Comparaison solveur mobile';
    case 'compare-stats-mobile':
      return 'Comparaison stats mobile';
    case 'compare-settings-mobile':
      return 'Comparaison paramètres mobile';
    case 'compare-integrations-mobile':
      return 'Comparaison intégrations mobile';
    case 'compare-modal-error-mobile':
      return 'Comparaison modal erreur mobile';
    case 'compare-modal-import-error-mobile':
      return 'Comparaison modal import mobile';
    case 'compare-modal-confirmation-mobile':
      return 'Comparaison modal confirmation mobile';
    case 'compare-empty-state-mobile':
      return 'Comparaison état vide mobile';
    case 'compare-loading-state-mobile':
      return 'Comparaison chargement mobile';
  }
}

export function getRouteDocumentTitle(route: AppRoute): string {
  return `${getRouteLabel(route)} | Woodpecker Trainer`;
}

export function normalizeRoute(route: AppRoute): AppRoute {
  if ((route.name === 'training-import' || route.name === 'training-solver') && !route.trainingId) {
    return { name: 'training-detail' };
  }

  return route;
}

export function parseRoute(pathname: string): AppRoute {
  const path = normalizePath(pathname);
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'compare') {
    if (segments[1] === 'mobile') {
      switch (segments[2]) {
        case 'dashboard':
          return { name: 'compare-dashboard-mobile' };
        case 'create-training':
          return { name: 'compare-create-training-mobile' };
        case 'detail':
          return { name: 'compare-detail-mobile' };
        case 'solver':
          return { name: 'compare-solver-mobile' };
        case 'stats':
          return { name: 'compare-stats-mobile' };
        case 'settings':
          return { name: 'compare-settings-mobile' };
        case 'integrations':
          return { name: 'compare-integrations-mobile' };
        case 'modal-error':
          return { name: 'compare-modal-error-mobile' };
        case 'modal-import-error':
          return { name: 'compare-modal-import-error-mobile' };
        case 'modal-confirmation':
          return { name: 'compare-modal-confirmation-mobile' };
        case 'empty-state':
          return { name: 'compare-empty-state-mobile' };
        case 'loading-state':
          return { name: 'compare-loading-state-mobile' };
        default:
          return { name: 'compare-dashboard-mobile' };
      }
    }

    switch (segments[1]) {
      case 'auth':
        return { name: 'compare-auth' };
      case 'dashboard':
        return { name: 'compare-dashboard' };
      case 'create-training':
        return { name: 'compare-create-training' };
      case 'detail':
        return { name: 'compare-detail' };
      case 'solver':
        return { name: 'compare-solver' };
      case 'stats':
        return { name: 'compare-stats' };
      case 'history':
        return { name: 'compare-history' };
      case 'import':
        return { name: 'compare-import' };
      case 'settings':
        return { name: 'compare-settings' };
      case 'library':
        return { name: 'compare-library' };
      case 'integrations':
        return { name: 'compare-integrations' };
      case 'planning':
        return { name: 'compare-planning' };
      case 'dashboard-advanced':
        return { name: 'compare-dashboard-advanced' };
      case 'modal-error':
        return { name: 'compare-modal-error' };
      case 'modal-confirmation':
        return { name: 'compare-modal-confirmation' };
      case 'empty-state':
        return { name: 'compare-empty-state' };
      case 'loading-state':
        return { name: 'compare-loading-state' };
      default:
        return { name: 'compare-dashboard' };
    }
  }

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
