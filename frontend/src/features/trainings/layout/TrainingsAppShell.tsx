import type { ReactNode } from 'react';
import AppNavigation from '../../../components/navigation/AppNavigation';
import type { AppRoute } from '../../../shared/routing/appRouter';
import type { Training, View } from '../trainingsTypes';
import './trainings-shell.css';

type TrainingsAppShellProps = {
  children: ReactNode;
  onLogout: () => void;
  onNavigateToView: (view: View) => void;
  route: AppRoute;
  selectedTraining: Training | null;
};

function TrainingsAppShell({ children, onLogout, onNavigateToView, route, selectedTraining }: TrainingsAppShellProps) {
  return (
    <main className="trainings-shell">
      <AppNavigation
        onLogout={onLogout}
        onSelectView={onNavigateToView}
        route={route}
        selectedTraining={selectedTraining}
      />
      <div className="trainings-shell__content">
        <div className="trainings-shell__body">{children}</div>
      </div>
    </main>
  );
}

export type { TrainingsAppShellProps };
export { TrainingsAppShell };
export default TrainingsAppShell;