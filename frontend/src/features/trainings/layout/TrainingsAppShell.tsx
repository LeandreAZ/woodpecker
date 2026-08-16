import { useEffect, useRef, type ReactElement, type ReactNode, type SVGProps } from 'react';
import type { AppRoute } from '../../../shared/routing/appRouter';
import type { AuthSession } from '../../auth/authStorage';
import { TrainingsRouteBar } from '../TrainingsRouteBar';
import type { Training, View } from '../trainingsTypes';
import './trainings-shell.css';

type TrainingsAppShellProps = {
  activeView: View;
  children: ReactNode;
  currentCycleStatusLabel: string;
  onLogout: () => void;
  onNavigateToView: (view: View) => void;
  route: AppRoute;
  selectedTraining: Training | null;
  session: AuthSession;
};

type NavigationItem = {
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  label: string;
  view: View;
  requiresTraining?: boolean;
};

function iconProps(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: '0 0 24 24',
    width: 24,
    height: 24,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...iconProps(props)}><path d="M4.8 10.4 12 4.8l7.2 5.6" /><path d="M6.5 9.7v8.3h4.4v-5.3h2.2v5.3h4.4V9.7" /></svg>;
}

function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...iconProps(props)}><circle cx="12" cy="12" r="7.2" /><circle cx="12" cy="12" r="3.6" /><path d="M12 8.4v3.6h3.6" /><path d="m15.6 8.4 2.8-2.8" /></svg>;
}

function RookIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...iconProps(props)}><path d="M7.2 6.2h2.1v2H11V6.2h2v2h1.7v-2h2.1v2.6l-1.3 2.3.8 6.5H7.7l.8-6.5-1.3-2.3Z" /><path d="M7 19h10" /></svg>;
}

function BarsIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...iconProps(props)}><path d="M5.5 18.5V11" /><path d="M10.2 18.5V7.5" /><path d="M14.9 18.5V13.3" /><path d="M19.6 18.5V5.5" /></svg>;
}

function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...iconProps(props)}><path d="M4.8 12a7.2 7.2 0 1 0 2.1-5.1" /><path d="M4.8 5.8v3.7h3.7" /><path d="M12 8v4.2l2.8 1.7" /></svg>;
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...iconProps(props)}><circle cx="12" cy="12" r="3.1" /><path d="M12 4.2v1.9" /><path d="M12 17.9v1.9" /><path d="m6.4 6.4 1.3 1.3" /><path d="m16.3 16.3 1.3 1.3" /><path d="M4.2 12h1.9" /><path d="M17.9 12h1.9" /><path d="m6.4 17.6 1.3-1.3" /><path d="m16.3 7.7 1.3-1.3" /></svg>;
}

function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...iconProps(props)}><path d="M9 4.8H7.2A2.4 2.4 0 0 0 4.8 7.2v9.6a2.4 2.4 0 0 0 2.4 2.4H9" /><path d="M13.2 8.2 18 12l-4.8 3.8" /><path d="M18 12H9.4" /></svg>;
}

const navigationItems: NavigationItem[] = [
  { icon: HomeIcon, label: 'Mes entraînements', view: 'dashboard' },
  { icon: TargetIcon, label: 'Entraînement sélectionné', view: 'detail', requiresTraining: true },
  { icon: RookIcon, label: 'Solveur', view: 'solver', requiresTraining: true },
  { icon: BarsIcon, label: 'Statistiques', view: 'stats' },
  { icon: HistoryIcon, label: 'Historique', view: 'history' },
  { icon: SettingsIcon, label: 'Paramètres', view: 'settings' },
];

function TrainingsAppShell({ activeView, children, currentCycleStatusLabel, onLogout, onNavigateToView, route, selectedTraining, session }: TrainingsAppShellProps) {
  const hasSelectedTraining = Boolean(selectedTraining);
  const contentRef = useRef<HTMLDivElement | null>(null);
  void session;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 1320px)').matches) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeView]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const media = window.matchMedia('(max-width: 1320px)');
    const syncScroll = (event?: MediaQueryListEvent) => {
      const matches = event ? event.matches : media.matches;
      if (!matches) {
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    };

    syncScroll();
    media.addEventListener('change', syncScroll);
    return () => media.removeEventListener('change', syncScroll);
  }, []);

  return (
    <main className="trainings-shell">
      <aside className="trainings-nav" aria-label="Navigation principale">
        <div className="trainings-nav__logo-block">
          <img alt="Woodpecker Trainer" className="trainings-nav__logo" src="/brand/woodpecker-logo-auth-tight.png" />
        </div>

        <nav className="trainings-nav__menu">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const disabled = Boolean(item.requiresTraining && !hasSelectedTraining);
            const isActive = activeView === item.view;

            return (
              <button key={item.view} aria-current={isActive ? 'page' : undefined} className={isActive ? 'trainings-nav__item is-active' : 'trainings-nav__item'} disabled={disabled} title={item.label} type="button" onClick={() => onNavigateToView(item.view)}>
                <span className="trainings-nav__item-icon"><Icon /></span>
                <span className="trainings-nav__item-label">{item.label}</span>
              </button>
            );
          })}

          <button className="trainings-nav__item trainings-nav__item--logout" title="Déconnexion" type="button" onClick={onLogout}>
            <span className="trainings-nav__item-icon"><LogOutIcon /></span>
            <span className="trainings-nav__item-label">Déconnexion</span>
          </button>
        </nav>
      </aside>

      <div ref={contentRef} className="trainings-shell__content">
        {activeView !== 'dashboard' ? (
          <TrainingsRouteBar activeView={activeView} currentCycleStatusLabel={currentCycleStatusLabel} route={route} selectedTraining={selectedTraining} />
        ) : null}
        <div className="trainings-shell__body">{children}</div>
      </div>
    </main>
  );
}

export type { TrainingsAppShellProps };
export { TrainingsAppShell };
export default TrainingsAppShell;
