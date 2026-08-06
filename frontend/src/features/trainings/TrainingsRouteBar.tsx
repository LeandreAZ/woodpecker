import type { AppRoute } from '../../shared/routing/appRouter';
import { getRouteLabel } from '../../shared/routing/appRouter';
import type { Training, View } from './trainingsTypes';

type TrainingsRouteBarProps = {
  activeView: View;
  currentCycleStatusLabel: string;
  route: AppRoute;
  selectedTraining: Training | null;
};

export function TrainingsRouteBar({ activeView, currentCycleStatusLabel, route, selectedTraining }: TrainingsRouteBarProps) {
  const routeLabel = getRouteLabel(route);
  const activeScope = selectedTraining ? selectedTraining.name : 'Aucun training ouvert';
  const pageHint = getPageHint(activeView, Boolean(selectedTraining));

  return (
    <header className="wp-route-bar">
      <div className="wp-route-copy">
        <div className="wp-route-breadcrumbs" aria-label="Position dans l'application">
          <span>Workspace</span>
          <span>{routeLabel}</span>
          {selectedTraining && <span>{selectedTraining.name}</span>}
        </div>
        <strong>{routeLabel}</strong>
        <p>{pageHint}</p>
      </div>

      <div className="wp-route-meta">
        <span>{activeScope}</span>
        <span>{selectedTraining ? currentCycleStatusLabel : 'Navigation generale'}</span>
      </div>
    </header>
  );
}

function getPageHint(activeView: View, hasSelectedTraining: boolean): string {
  switch (activeView) {
    case 'dashboard':
      return 'Retrouve tes entrainements, ouvre un set existant ou repars sur une nouvelle creation.';
    case 'create':
      return 'Cette page sert uniquement a preparer un nouvel entrainement avant ajout de puzzles.';
    case 'detail':
      return hasSelectedTraining
        ? 'Cette page rassemble la collection, les cycles et l’historique du training actif.'
        : 'Ouvre un training pour afficher sa page de detail complete.';
    case 'import':
      return hasSelectedTraining
        ? 'Importe un lot CSV dans le training actif avec verification avant envoi.'
        : 'Choisis d’abord un training pour acceder a la page d’import.';
    case 'solver':
      return hasSelectedTraining
        ? 'Resous les puzzles du training actif dans une page dediee au solveur.'
        : 'Choisis d’abord un training pour acceder a la page solveur.';
  }
}
