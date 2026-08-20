import type { AppRoute } from '../../shared/routing/appRouter';
import { getRouteLabel } from '../../shared/routing/appRouter';
import type { Training, View } from './trainingsTypes';

type TrainingsRouteBarProps = {
  activeView: View;
  currentCycleStatusLabel: string;
  route: AppRoute;
  selectedTraining: Training | null;
};

function TrainingsRouteBar({
  activeView,
  currentCycleStatusLabel,
  route,
  selectedTraining,
}: TrainingsRouteBarProps) {
  if (activeView === 'dashboard' || activeView === 'detail' || activeView === 'solver') {
    return null;
  }

  const routeLabel = getRouteLabel(route);
  const pageHint = getPageHint(activeView, Boolean(selectedTraining));
  const metaTitle = selectedTraining ? selectedTraining.name : routeLabel;
  const metaState = selectedTraining ? currentCycleStatusLabel : 'Vue générale';

  return (
    <header className="wp-route-bar wp-route-bar-refined">
      <div className="wp-route-copy">
        <div className="wp-route-breadcrumbs" aria-label="Position dans l'application">
          <span>Entraînements</span>
          <span>{routeLabel}</span>
          {selectedTraining ? <span>{selectedTraining.name}</span> : null}
        </div>
        <strong>{metaTitle}</strong>
        <p>{pageHint}</p>
      </div>

      <div className="wp-route-meta wp-route-meta-refined">
        <span>{selectedTraining ? selectedTraining.name : 'Mes entraînements'}</span>
        <small>{metaState}</small>
      </div>
    </header>
  );
}

function getPageHint(activeView: View, hasSelectedTraining: boolean): string {
  switch (activeView) {
    case 'dashboard':
      return 'Entraînements basés sur la méthode Woodpecker.';
    case 'create':
      return 'Créez un nouvel entraînement avant de constituer votre collection de puzzles.';
    case 'detail':
      return hasSelectedTraining
        ? 'Améliorez votre vision tactique, suivez votre cycle et pilotez votre collection.'
        : "Ouvrez un entraînement depuis le tableau de bord pour afficher son détail.";
    case 'import':
      return hasSelectedTraining
        ? "Vérifiez votre fichier et importez des puzzles propres dans l'entraînement actif."
        : "Sélectionnez d'abord un entraînement pour accéder à l'import.";
    case 'solver':
      return hasSelectedTraining
        ? 'Cycle actif, progression et position courante réunis dans une vue dédiée.'
        : "Sélectionnez d'abord un entraînement pour accéder au solveur.";
    case 'stats':
      return "Analysez vos performances, suivez votre progression et identifiez vos axes d'amélioration.";
    case 'history':
      return 'Revoyez votre activité, vos cycles et vos tentatives récentes.';
    case 'settings':
      return "Gérez votre compte, vos préférences d'entraînement et vos intégrations.";
  }
}

export { TrainingsRouteBar };
export default TrainingsRouteBar;
