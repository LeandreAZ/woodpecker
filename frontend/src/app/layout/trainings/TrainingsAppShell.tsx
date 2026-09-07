import type { ReactNode } from 'react';
import AppNavigation from '../navigation/AppNavigation';
import type { AppRoute } from '../../routing/appRouter';
import type { Training, View } from '../../../features/trainings/types/training.types';
import type { UserSettingsOverview } from '../../../features/settings/types/settings.types';
import './trainings-shell.css';

type TrainingsAppShellProps = {
  children: ReactNode;
  profile?: UserSettingsOverview['profile'];
  onLogout: () => void;
  onNavigateToView: (view: View) => void;
  route: AppRoute;
  selectedTraining: Training | null;
};

function TrainingsAppShell({ children, profile, onLogout, onNavigateToView, route, selectedTraining }: TrainingsAppShellProps) {
  return (
    <main className="trainings-shell">
      <AppNavigation
        profile={profile}
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