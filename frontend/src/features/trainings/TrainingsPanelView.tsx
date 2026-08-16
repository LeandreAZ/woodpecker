import type { AppRoute } from '../../shared/routing/appRouter';
import type { AuthSession } from '../auth/authStorage';
import TrainingsAppShell from './layout/TrainingsAppShell';
import { TrainingsPanelContentScreen } from './TrainingsPanelContentScreen';
import { useTrainingsPanelState } from './useTrainingsPanelState';
import { useTrainingsPanelRouting } from './useTrainingsPanelRouting';
import type { View } from './trainingsTypes';

type TrainingsPanelProps = {
  session: AuthSession;
  onLogout: () => void;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  route: AppRoute;
};

function TrainingsPanelView({ session, onLogout, onNavigate, route }: TrainingsPanelProps) {
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
    <TrainingsAppShell
      activeView={state.activeView}
      currentCycleStatusLabel={state.currentCycleStatusLabel}
      onLogout={onLogout}
      onNavigateToView={navigateToView}
      route={route}
      selectedTraining={state.selectedTraining}
      session={session}
    >
      <TrainingsPanelContentScreen
        navigateToPuzzleSolver={navigateToPuzzleSolver}
        navigateToTraining={(trainingIri, view) => navigateToTraining(trainingIri, state.openTraining, view)}
        navigateToView={navigateToView}
        state={state}
      />
    </TrainingsAppShell>
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

export type { TrainingsPanelProps };
export { TrainingsPanelView };
export default TrainingsPanelView;


