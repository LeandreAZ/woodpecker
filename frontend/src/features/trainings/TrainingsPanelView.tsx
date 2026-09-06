import { StatePanel } from '../../components/ui/StatePanel';
import { AppErrorBoundary } from '../../shared/AppErrorBoundary';
import type { AppRoute } from '../../shared/routing/appRouter';
import type { AuthSession } from '../auth/authStorage';
import TrainingsPanelContent from './TrainingsPanelContent';
import TrainingsAppShell from './layout/TrainingsAppShell';
import { useTrainingsPanelRouting } from './useTrainingsPanelRouting';
import { useTrainingsPanelState } from './useTrainingsPanelState';
import type { View } from './trainingsTypes';

const emptyTrainings: never[] = [];

type TrainingsPanelProps = {
  session: AuthSession;
  onLogout: () => void;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  route: AppRoute;
};

function TrainingsPanelView({ session, onLogout, onNavigate, route }: TrainingsPanelProps) {
  const state = useTrainingsPanelState(session, viewFromRoute(route));
  const trainings = state.trainingsQuery.data ?? emptyTrainings;
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
    setSavedCyclePuzzleIris: state.setSavedCyclePuzzleIris,
    setSelectedTrainingIri: state.setSelectedTrainingIri,
    setSelectedTrainingPuzzleIri: state.setSelectedTrainingPuzzleIri,
    trainings,
    trainingsArePending: state.trainingsQuery.isLoading || state.trainingsQuery.isFetching,
  });

  return (
    <TrainingsAppShell
      onLogout={onLogout}
      onNavigateToView={navigateToView}
      route={route}
      profile={state.userSettingsOverviewQuery.data?.profile}
      selectedTraining={state.selectedTraining}
    >
      {route.name === 'not-found' || ('trainingId' in route && route.trainingId && state.trainingsQuery.isSuccess && !trainings.some((training) => training.id === route.trainingId)) ? <StatePanel kind="404" onBack={() => navigateToView('dashboard')} /> : <AppErrorBoundary key={route.name} onBack={() => navigateToView('dashboard')}><TrainingsPanelContent
        navigateToPuzzleSolver={navigateToPuzzleSolver}
        navigateToTraining={(trainingIri, view) => navigateToTraining(trainingIri, state.openTraining, view)}
        navigateToView={navigateToView}
        state={state}
      /></AppErrorBoundary>}
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

export type { TrainingsPanelProps };
export { TrainingsPanelView };
export default TrainingsPanelView;
