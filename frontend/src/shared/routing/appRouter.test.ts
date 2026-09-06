import { describe, expect, it } from 'vitest';
import { buildPath, normalizeRoute, parseRoute, routesEqual, type AppRoute } from './appRouter';

describe('appRouter', () => {
  it('conserve les routes training completes', () => {
    const route: AppRoute = { name: 'training-solver', trainingId: 12 };

    expect(normalizeRoute(route)).toEqual(route);
    expect(buildPath(route)).toBe('/trainings/12/solver');
  });

  it('construit et parse les nouvelles pages produit', () => {
    expect(buildPath({ name: 'stats-overview' })).toBe('/stats');
    expect(buildPath({ name: 'history-detail' })).toBe('/history');
    expect(buildPath({ name: 'user-settings' })).toBe('/settings');
    expect(parseRoute('/stats')).toEqual({ name: 'stats-overview' });
    expect(parseRoute('/history')).toEqual({ name: 'history-detail' });
    expect(parseRoute('/settings')).toEqual({ name: 'user-settings' });
  });

  it('normalise les routes import orphelines vers le detail training', () => {
    expect(normalizeRoute({ name: 'training-import' })).toEqual({ name: 'training-detail' });
    expect(buildPath({ name: 'training-import' })).toBe('/trainings');
    expect(parseRoute('/import')).toEqual({ name: 'training-detail' });
  });

  it('normalise les routes solveur orphelines vers le detail training', () => {
    expect(normalizeRoute({ name: 'training-solver' })).toEqual({ name: 'training-detail' });
    expect(buildPath({ name: 'training-solver' })).toBe('/trainings');
    expect(parseRoute('/solver')).toEqual({ name: 'training-detail' });
  });

  it('renvoie une 404 pour les ids invalides et les chemins inconnus', () => {
    expect(parseRoute('/trainings/abc/import')).toEqual({ name: 'not-found', path: '/trainings/abc/import' });
    expect(parseRoute('/trainings/0/solver')).toEqual({ name: 'not-found', path: '/trainings/0/solver' });
    expect(parseRoute('/absent')).toEqual({ name: 'not-found', path: '/absent' });
  });

  it('compare les routes sur leur chemin canonique', () => {
    expect(routesEqual({ name: 'training-detail' }, { name: 'training-import' })).toBe(true);
    expect(routesEqual({ name: 'training-detail' }, { name: 'training-solver' })).toBe(true);
    expect(routesEqual({ name: 'training-detail', trainingId: 2 }, { name: 'training-solver', trainingId: 2 })).toBe(false);
  });
});
