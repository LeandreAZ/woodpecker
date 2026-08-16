import type { FunctionComponent, SVGProps } from 'react';
import * as AppIcons from '../../shared/AppIcons';
import { NavButton } from './TrainingsViewPrimitives';
import type { Training, View } from './trainingsTypes';

type TrainingsSidebarProps = {
  activeView: View;
  currentCycleStatusLabel: string;
  cycleStats: unknown;
  onLogout: () => void;
  onNavigateToView: (view: View) => void;
  selectedPuzzleCount: number;
  selectedTraining: Training | null;
  session: { email: string };
};

const navItems: Array<{
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  label: string;
  view: View;
  requiresTraining?: boolean;
}> = [
  { icon: AppIcons.HomeIcon, label: 'Mes entraînements', view: 'dashboard' },
  { icon: AppIcons.BarsIcon, label: 'Statistiques', view: 'stats' },
  { icon: AppIcons.SettingsIcon, label: 'Paramètres', view: 'settings' },
  { icon: AppIcons.TargetIcon, label: 'Entraînement sélectionné', view: 'detail', requiresTraining: true },
  { icon: AppIcons.RookIcon, label: 'Solveur', view: 'solver', requiresTraining: true },
  { icon: AppIcons.HistoryIcon, label: 'Historique', view: 'history' },
];

function TrainingsSidebar({ activeView, onLogout, onNavigateToView, selectedTraining }: TrainingsSidebarProps) {
  const hasSelectedTraining = Boolean(selectedTraining);

  return (
    <aside className="wp-sidebar wp-sidebar-dashboard-v4">
      <div className="wp-sidebar-dashboard-v4__top">
        <div className="wp-sidebar-dashboard-v4__logo">
          <img alt="Woodpecker Trainer" src="/brand/woodpecker-logo-auth-tight.png" />
        </div>

        <nav className="wp-sidebar-dashboard-v4__nav" aria-label="Navigation principale">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavButton
                key={item.view}
                active={activeView === item.view}
                disabled={Boolean(item.requiresTraining && !hasSelectedTraining)}
                onClick={() => onNavigateToView(item.view)}
              >
                <span className="wp-sidebar-dashboard-v4__nav-inner">
                  <span className="wp-sidebar-dashboard-v4__nav-icon">
                    <Icon />
                  </span>
                  <span className="wp-sidebar-dashboard-v4__nav-label">{item.label}</span>
                </span>
              </NavButton>
            );
          })}
        </nav>
      </div>

      <div className="wp-sidebar-dashboard-v4__spacer" />

      <button className="wp-sidebar-dashboard-v4__logout" type="button" onClick={onLogout}>
        <span className="wp-sidebar-dashboard-v4__nav-inner">
          <span className="wp-sidebar-dashboard-v4__nav-icon">
            <AppIcons.HomeIcon />
          </span>
          <span className="wp-sidebar-dashboard-v4__nav-label">Déconnexion</span>
        </span>
      </button>
    </aside>
  );
}

export { TrainingsSidebar };
export default TrainingsSidebar;

