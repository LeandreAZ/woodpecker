import {
  ChartNoAxesCombined,
  History,
  House,
  LogOut,
  Puzzle,
  Settings,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type { AppRoute } from '../../shared/routing/appRouter';
import { OFFICIAL_WOODPECKER_LOGO } from '../../shared/brand';
import type { Training, View } from '../../features/trainings/trainingsTypes';
import './app-navigation.css';

type AppNavigationProps = {
  onLogout: () => void;
  onSelectView: (view: View) => void;
  route: AppRoute;
  selectedTraining: Training | null;
};

type NavigationItem = {
  icon: LucideIcon;
  label: string;
  view: View;
  requiresTraining?: boolean;
};

const navigationItems: NavigationItem[] = [
  { icon: House, label: 'Mes entraînements', view: 'dashboard' },
  { icon: Target, label: 'Entraînement sélectionné', view: 'detail', requiresTraining: true },
  { icon: Puzzle, label: 'Solveur', view: 'solver', requiresTraining: true },
  { icon: ChartNoAxesCombined, label: 'Statistiques', view: 'stats' },
  { icon: History, label: 'Historique', view: 'history' },
  { icon: Settings, label: 'Paramètres', view: 'settings' },
];

function AppNavigation({ onLogout, onSelectView, route, selectedTraining }: AppNavigationProps) {
  const activeView = getActiveNavigationView(route);
  const hasSelectedTraining = Boolean(selectedTraining);

  return (
    <>
      <DesktopNavigation
        activeView={activeView}
        hasSelectedTraining={hasSelectedTraining}
        onLogout={onLogout}
        onSelectView={onSelectView}
      />
      <MobileNavigation
        activeView={activeView}
        hasSelectedTraining={hasSelectedTraining}
        onLogout={onLogout}
        onSelectView={onSelectView}
      />
    </>
  );
}

type SharedNavigationProps = {
  activeView: View;
  hasSelectedTraining: boolean;
  onLogout: () => void;
  onSelectView: (view: View) => void;
};

function DesktopNavigation({ activeView, hasSelectedTraining, onLogout, onSelectView }: SharedNavigationProps) {
  return (
    <aside className="wp-app-navigation wp-app-navigation--desktop" aria-label="Navigation principale">
      <div className="wp-app-navigation__panel">
        <button className="wp-app-navigation__logo-link" aria-label="Retour au tableau de bord Woodpecker Trainer" type="button" onClick={() => onSelectView('dashboard')}>
          <img alt="Woodpecker Trainer" className="wp-app-navigation__logo" src={OFFICIAL_WOODPECKER_LOGO} />
        </button>

        <nav className="wp-app-navigation__menu">
          {navigationItems.map((item) => (
            <NavigationButton
              key={item.view}
              active={activeView === item.view}
              compact={false}
              disabled={Boolean(item.requiresTraining && !hasSelectedTraining && activeView !== item.view)}
              icon={item.icon}
              label={item.label}
              onClick={() => onSelectView(item.view)}
            />
          ))}
        </nav>

        <div className="wp-app-navigation__footer">
          <button className="wp-app-navigation__logout" type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" size={20} strokeWidth={1.9} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileNavigation({ activeView, hasSelectedTraining, onLogout, onSelectView }: SharedNavigationProps) {
  return (
    <header className="wp-app-navigation wp-app-navigation--mobile" aria-label="Navigation principale mobile">
      <nav className="wp-app-navigation-mobile__bar">
        <div className="wp-app-navigation-mobile__items">
          {navigationItems.map((item) => (
            <NavigationButton
              key={item.view}
              active={activeView === item.view}
              compact={true}
              disabled={Boolean(item.requiresTraining && !hasSelectedTraining && activeView !== item.view)}
              icon={item.icon}
              label={item.label}
              onClick={() => onSelectView(item.view)}
            />
          ))}
        </div>
        <button
          aria-label="Déconnexion"
          className="wp-app-navigation-mobile__logout"
          type="button"
          onClick={onLogout}
        >
          <LogOut aria-hidden="true" size={22} strokeWidth={1.9} />
        </button>
      </nav>
    </header>
  );
}

type NavigationButtonProps = {
  active: boolean;
  compact: boolean;
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

function NavigationButton({ active, compact, disabled, icon: Icon, label, onClick }: NavigationButtonProps) {
  const className = compact
    ? active
      ? 'wp-app-navigation-mobile__item is-active'
      : 'wp-app-navigation-mobile__item'
    : active
      ? 'wp-app-navigation__item is-active'
      : 'wp-app-navigation__item';

  return (
    <button
      aria-current={active ? 'page' : undefined}
      aria-label={compact ? label : undefined}
      className={className}
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={compact ? 22 : 20} strokeWidth={1.9} />
      {compact ? null : <span>{label}</span>}
    </button>
  );
}

function getActiveNavigationView(route: AppRoute): View {
  switch (route.name) {
    case 'dashboard':
    case 'create-training':
      return 'dashboard';
    case 'training-detail':
    case 'training-edit':
    case 'training-import':
      return 'detail';
    case 'training-solver':
      return 'solver';
    case 'stats-overview':
      return 'stats';
    case 'history-detail':
      return 'history';
    case 'user-settings':
      return 'settings';
    case 'auth':
      return 'dashboard';
  }
}

export type { AppNavigationProps };
export { AppNavigation };
export default AppNavigation;