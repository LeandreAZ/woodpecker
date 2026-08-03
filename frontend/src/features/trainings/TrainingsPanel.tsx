import type { AppRoute } from '../../shared/routing/appRouter';
import { TrainingsPanelContent } from './TrainingsPanelContent';
import { TrainingsSidebar } from './TrainingsSidebar';
import type { AuthSession } from '../auth/authStorage';
import { useTrainingsPanelState } from './useTrainingsPanelState';
import { useTrainingsPanelRouting } from './useTrainingsPanelRouting';
import type { View } from './trainingsTypes';

type TrainingsPanelProps = {
  session: AuthSession;
  onLogout: () => void;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  route: AppRoute;
};

export function TrainingsPanel({ session, onLogout, onNavigate, route }: TrainingsPanelProps) {
  const state = useTrainingsPanelState(session, viewFromRoute(route));
  const trainings = state.trainingsQuery.data ?? [];
  const { navigateToPuzzleSolver, navigateToTraining, navigateToView } = useTrainingsPanelRouting({
    activeView: state.activeView,
    effectiveSelectedTrainingIri: state.effectiveSelectedTrainingIri,
    onNavigate,
    route,
    selectedTraining: state.selectedTraining,
    setActiveCycleIri: state.setActiveCycleIri,
    setActiveTrainingSessionIri: state.setActiveTrainingSessionIri,
    setActiveView: state.setActiveView,
    setFailedCyclePuzzleIris: state.setFailedCyclePuzzleIris,
    setMistakeLimitOverride: state.setMistakeLimitOverride,
    setSavedCyclePuzzleIris: state.setSavedCyclePuzzleIris,
    setSelectedTrainingIri: state.setSelectedTrainingIri,
    setSelectedTrainingPuzzleIri: state.setSelectedTrainingPuzzleIri,
    trainings,
    trainingsArePending: state.trainingsQuery.isLoading || state.trainingsQuery.isFetching,
  });

  return (
    <main className="wp-layout">
      <TrainingsSidebar
        activeView={state.activeView}
        currentCycleStatusLabel={state.currentCycleStatusLabel}
        cycleStats={state.cycleStats}
        onLogout={onLogout}
        onNavigateToView={navigateToView}
        selectedPuzzleCount={state.selectedPuzzleCount}
        selectedTraining={state.selectedTraining}
        session={session}
      />

      <TrainingsPanelContent
        navigateToPuzzleSolver={navigateToPuzzleSolver}
        navigateToTraining={(trainingIri, view) => navigateToTraining(trainingIri, state.openTraining, view)}
        navigateToView={navigateToView}
        state={state}
      />
    </main>
  );
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
