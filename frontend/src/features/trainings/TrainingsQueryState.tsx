import type { ReactNode } from 'react';
import { ErrorState } from '../../components/ui/StatePanel';
import { PageSkeleton } from '../../components/ui/PageSkeleton';
import { PageHeader } from './TrainingsViewPrimitives';
import type { useTrainingsPanelState } from './useTrainingsPanelState';

type State = ReturnType<typeof useTrainingsPanelState>;
type Query = { data?: unknown; error?: unknown; isError?: boolean; isLoading?: boolean; isFetching?: boolean; refetch: () => unknown };
export function TrainingsQueryState({ state, onBack, children }: { state: State; onBack: () => void; children: ReactNode }) {
  const common = [state.trainingsQuery];
  const groups = {
    dashboard: [...common, state.dashboardSummariesQuery, state.statsOverviewQuery],
    detail: [...common, state.trainingOverviewQuery, state.trainingPuzzlesQuery, state.trainingSummaryQuery, state.trainingAnalyticsQuery],
    edit: common, create: [], import: [...common, state.trainingOverviewQuery],
    solver: [...common, state.trainingOverviewQuery, state.trainingPuzzlesQuery,  state.cyclePuzzlesQuery, state.userSettingsOverviewQuery],
    stats: [state.statsOverviewQuery, state.trainingSummaryQuery],
    history: [state.historyOverviewQuery, state.trainingAttemptHistoryQuery, state.trainingCycleHistoryQuery],
    settings: [state.userSettingsOverviewQuery],
  };
  const queries = groups[state.activeView].filter(Boolean) as Query[];
  const failed = queries.find((query) => query.isError);
  const titles = { dashboard: 'Mes entraînements', detail: 'Détail de l’entraînement', edit: 'Modifier l’entraînement', create: 'Créer un entraînement', import: 'Importer des puzzles', solver: 'Solveur', stats: 'Statistiques', history: 'Historique', settings: 'Paramètres' };
  if (failed) return <div className="wp-page"><PageHeader title={titles[state.activeView]} description="Retrouvez vos données et poursuivez votre entraînement." /><ErrorState error={failed.error} onBack={onBack} retrying={failed.isFetching} onRetry={() => { void failed.refetch(); }} /></div>;
  if (queries.some((query) => query.isLoading && query.data === undefined)) {
    const layout = state.activeView === 'create' || state.activeView === 'edit' ? 'form' : state.activeView === 'import' ? 'detail' : state.activeView;
    return <PageSkeleton layout={layout} />;
  }
  return <>{children}</>;
}
