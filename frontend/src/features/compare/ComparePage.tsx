import type { AppRoute } from '../../shared/routing/appRouter';
import './compare.css';

type CompareRouteName =
  | 'compare-auth'
  | 'compare-dashboard'
  | 'compare-create-training'
  | 'compare-detail'
  | 'compare-solver'
  | 'compare-stats'
  | 'compare-history'
  | 'compare-import'
  | 'compare-settings'
  | 'compare-library'
  | 'compare-integrations'
  | 'compare-planning'
  | 'compare-dashboard-advanced'
  | 'compare-modal-error'
  | 'compare-modal-confirmation'
  | 'compare-empty-state'
  | 'compare-loading-state'
  | 'compare-dashboard-mobile'
  | 'compare-create-training-mobile'
  | 'compare-detail-mobile'
  | 'compare-solver-mobile'
  | 'compare-stats-mobile'
  | 'compare-settings-mobile'
  | 'compare-integrations-mobile'
  | 'compare-modal-error-mobile'
  | 'compare-modal-import-error-mobile'
  | 'compare-modal-confirmation-mobile'
  | 'compare-empty-state-mobile'
  | 'compare-loading-state-mobile';

type ComparePageProps = {
  route: Extract<AppRoute, { name: CompareRouteName }>;
};

type CompareConfig = {
  title: string;
  description: string;
  mockup: string;
  current?: string;
  liveSrc?: string;
  active: CompareRouteName;
  viewport: 'desktop' | 'mobile';
};

type CompareLink = {
  href: string;
  label: string;
  key: CompareRouteName;
};

const compareConfigs: Record<CompareRouteName, CompareConfig> = {
  'compare-auth': {
    title: 'Comparaison auth',
    description: 'Maquette de reference et rendu actuel du site pour l ecran d authentification.',
    mockup: '/compare-assets/mockups/auth.png',
    current: '/compare-assets/current/auth.png',
    active: 'compare-auth',
    viewport: 'desktop',
  },
  'compare-dashboard': {
    title: 'Comparaison dashboard',
    description: 'Maquette de reference et rendu actuel du site pour le dashboard principal.',
    mockup: '/compare-assets/mockups/dashboard.png',
    current: '/compare-assets/current/dashboard-page-current.png',
    active: 'compare-dashboard',
    viewport: 'desktop',
  },
  'compare-create-training': {
    title: 'Comparaison creation training',
    description: 'Maquette de reference pour la creation d un entrainement.',
    mockup: '/compare-assets/mockups/create-training.png',
    active: 'compare-create-training',
    viewport: 'desktop',
  },
  'compare-detail': {
    title: 'Comparaison detail training',
    description: 'Maquette de reference et rendu actuel du site pour la page detail training.',
    mockup: '/compare-assets/mockups/detail.png',
    current: '/compare-assets/current/detail.png',
    active: 'compare-detail',
    viewport: 'desktop',
  },
  'compare-solver': {
    title: 'Comparaison solveur',
    description: 'Maquette de reference et rendu actuel du site pour le solveur.',
    mockup: '/compare-assets/mockups/solver.png',
    current: '/compare-assets/current/solver.png',
    active: 'compare-solver',
    viewport: 'desktop',
  },
  'compare-stats': {
    title: 'Comparaison statistiques',
    description: 'Maquette de reference pour les statistiques globales.',
    mockup: '/compare-assets/mockups/stats.png',
    active: 'compare-stats',
    viewport: 'desktop',
  },
  'compare-history': {
    title: 'Comparaison historique',
    description: 'Maquette de reference pour l historique detaille.',
    mockup: '/compare-assets/mockups/history.png',
    active: 'compare-history',
    viewport: 'desktop',
  },
  'compare-import': {
    title: 'Comparaison import CSV',
    description: 'Maquette de reference pour l import de puzzles.',
    mockup: '/compare-assets/mockups/import.png',
    active: 'compare-import',
    viewport: 'desktop',
  },
  'compare-settings': {
    title: 'Comparaison parametres',
    description: 'Maquette de reference pour le compte et les preferences.',
    mockup: '/compare-assets/mockups/settings.png',
    active: 'compare-settings',
    viewport: 'desktop',
  },
  'compare-library': {
    title: 'Comparaison bibliotheque',
    description: 'Maquette conservee en archive. Elle n est plus prioritaire produit.',
    mockup: '/compare-assets/mockups/library.png',
    active: 'compare-library',
    viewport: 'desktop',
  },
  'compare-integrations': {
    title: 'Comparaison integrations',
    description: 'Maquette de reference pour les integrations externes.',
    mockup: '/compare-assets/mockups/integrations.png',
    active: 'compare-integrations',
    viewport: 'desktop',
  },
  'compare-planning': {
    title: 'Comparaison planning',
    description: 'Maquette conservee en archive. Elle n est plus prioritaire produit.',
    mockup: '/compare-assets/mockups/planning.png',
    active: 'compare-planning',
    viewport: 'desktop',
  },
  'compare-dashboard-advanced': {
    title: 'Comparaison dashboard avance',
    description: 'Maquette conservee en archive. Une seule version de dashboard est visee.',
    mockup: '/compare-assets/mockups/dashboard-advanced.png',
    active: 'compare-dashboard-advanced',
    viewport: 'desktop',
  },
  'compare-modal-error': {
    title: 'Comparaison modal erreur',
    description: 'Etat modal d erreur sur le flux de planification.',
    mockup: '/compare-assets/mockups/modal-error.png',
    active: 'compare-modal-error',
    viewport: 'desktop',
  },
  'compare-modal-confirmation': {
    title: 'Comparaison modal confirmation',
    description: 'Etat modal de confirmation pour suppression d un entrainement.',
    mockup: '/compare-assets/mockups/modal-confirmation.png',
    active: 'compare-modal-confirmation',
    viewport: 'desktop',
  },
  'compare-empty-state': {
    title: 'Comparaison etat vide',
    description: 'Etat vide de reference pour la liste d entrainements.',
    mockup: '/compare-assets/mockups/empty-state.png',
    active: 'compare-empty-state',
    viewport: 'desktop',
  },
  'compare-loading-state': {
    title: 'Comparaison chargement',
    description: 'Etat de chargement de reference pour le dashboard.',
    mockup: '/compare-assets/mockups/loading-state.png',
    active: 'compare-loading-state',
    viewport: 'desktop',
  },
  'compare-dashboard-mobile': {
    title: 'Comparaison dashboard mobile',
    description: 'Base mobile pour le dashboard.',
    mockup: '/compare-assets/mockups/dashboard-mobile.png',
    active: 'compare-dashboard-mobile',
    viewport: 'mobile',
  },
  'compare-create-training-mobile': {
    title: 'Comparaison creation mobile',
    description: 'Base mobile pour la creation d un entrainement.',
    mockup: '/compare-assets/mockups/create-training-mobile.png',
    active: 'compare-create-training-mobile',
    viewport: 'mobile',
  },
  'compare-detail-mobile': {
    title: 'Comparaison detail mobile',
    description: 'Base mobile pour le detail d un entrainement.',
    mockup: '/compare-assets/mockups/detail-mobile.png',
    active: 'compare-detail-mobile',
    viewport: 'mobile',
  },
  'compare-solver-mobile': {
    title: 'Comparaison solveur mobile',
    description: 'Base mobile pour le solveur.',
    mockup: '/compare-assets/mockups/solver-mobile.png',
    active: 'compare-solver-mobile',
    viewport: 'mobile',
  },
  'compare-stats-mobile': {
    title: 'Comparaison stats mobile',
    description: 'Base mobile pour les statistiques.',
    mockup: '/compare-assets/mockups/stats-mobile.png',
    active: 'compare-stats-mobile',
    viewport: 'mobile',
  },
  'compare-settings-mobile': {
    title: 'Comparaison parametres mobile',
    description: 'Base mobile pour le compte et les preferences.',
    mockup: '/compare-assets/mockups/settings-mobile.png',
    active: 'compare-settings-mobile',
    viewport: 'mobile',
  },
  'compare-integrations-mobile': {
    title: 'Comparaison integrations mobile',
    description: 'Base mobile pour les integrations.',
    mockup: '/compare-assets/mockups/integrations-mobile.png',
    active: 'compare-integrations-mobile',
    viewport: 'mobile',
  },
  'compare-modal-error-mobile': {
    title: 'Comparaison modal erreur mobile',
    description: 'Etat d erreur mobile generique.',
    mockup: '/compare-assets/mockups/modal-error-mobile.png',
    active: 'compare-modal-error-mobile',
    viewport: 'mobile',
  },
  'compare-modal-import-error-mobile': {
    title: 'Comparaison modal import mobile',
    description: 'Etat d erreur mobile pour un import CSV invalide.',
    mockup: '/compare-assets/mockups/modal-import-error-mobile.png',
    active: 'compare-modal-import-error-mobile',
    viewport: 'mobile',
  },
  'compare-modal-confirmation-mobile': {
    title: 'Comparaison modal confirmation mobile',
    description: 'Etat de confirmation mobile.',
    mockup: '/compare-assets/mockups/modal-confirmation-mobile.png',
    active: 'compare-modal-confirmation-mobile',
    viewport: 'mobile',
  },
  'compare-empty-state-mobile': {
    title: 'Comparaison etat vide mobile',
    description: 'Etat vide mobile de reference.',
    mockup: '/compare-assets/mockups/empty-state-mobile.png',
    active: 'compare-empty-state-mobile',
    viewport: 'mobile',
  },
  'compare-loading-state-mobile': {
    title: 'Comparaison chargement mobile',
    description: 'Etat de chargement mobile de reference.',
    mockup: '/compare-assets/mockups/loading-state-mobile.png',
    active: 'compare-loading-state-mobile',
    viewport: 'mobile',
  },
};

const desktopCompareLinks: CompareLink[] = [
  { href: '/compare/auth', label: 'auth', key: 'compare-auth' },
  { href: '/compare/dashboard', label: 'dashboard', key: 'compare-dashboard' },
  { href: '/compare/create-training', label: 'creation', key: 'compare-create-training' },
  { href: '/compare/detail', label: 'detail', key: 'compare-detail' },
  { href: '/compare/solver', label: 'solver', key: 'compare-solver' },
  { href: '/compare/stats', label: 'stats', key: 'compare-stats' },
  { href: '/compare/history', label: 'history', key: 'compare-history' },
  { href: '/compare/import', label: 'import', key: 'compare-import' },
  { href: '/compare/settings', label: 'settings', key: 'compare-settings' },
  { href: '/compare/integrations', label: 'integrations', key: 'compare-integrations' },
  { href: '/compare/modal-error', label: 'modal-error', key: 'compare-modal-error' },
  { href: '/compare/modal-confirmation', label: 'modal-confirm', key: 'compare-modal-confirmation' },
  { href: '/compare/empty-state', label: 'empty', key: 'compare-empty-state' },
  { href: '/compare/loading-state', label: 'loading', key: 'compare-loading-state' },
  { href: '/compare/library', label: 'library-archive', key: 'compare-library' },
  { href: '/compare/planning', label: 'planning-archive', key: 'compare-planning' },
  { href: '/compare/dashboard-advanced', label: 'advanced-archive', key: 'compare-dashboard-advanced' },
];

const mobileCompareLinks: CompareLink[] = [
  { href: '/compare/mobile/dashboard', label: 'dashboard', key: 'compare-dashboard-mobile' },
  { href: '/compare/mobile/create-training', label: 'creation', key: 'compare-create-training-mobile' },
  { href: '/compare/mobile/detail', label: 'detail', key: 'compare-detail-mobile' },
  { href: '/compare/mobile/solver', label: 'solver', key: 'compare-solver-mobile' },
  { href: '/compare/mobile/stats', label: 'stats', key: 'compare-stats-mobile' },
  { href: '/compare/mobile/settings', label: 'settings', key: 'compare-settings-mobile' },
  { href: '/compare/mobile/integrations', label: 'integrations', key: 'compare-integrations-mobile' },
  { href: '/compare/mobile/modal-error', label: 'modal-error', key: 'compare-modal-error-mobile' },
  { href: '/compare/mobile/modal-import-error', label: 'modal-import', key: 'compare-modal-import-error-mobile' },
  { href: '/compare/mobile/modal-confirmation', label: 'modal-confirm', key: 'compare-modal-confirmation-mobile' },
  { href: '/compare/mobile/empty-state', label: 'empty', key: 'compare-empty-state-mobile' },
  { href: '/compare/mobile/loading-state', label: 'loading', key: 'compare-loading-state-mobile' },
];

function ComparePane({ label, src, viewport }: { label: string; src: string; viewport: 'desktop' | 'mobile' }) {
  const cacheSafeSrc = `${src}?v=${Date.now()}`;
  const mobile = viewport === 'mobile';

  return (
    <section className="compare-page__surface compare-page__pane">
      <div className="compare-page__pane-head">
        <div>
          <strong className="compare-page__pane-title">{label}</strong>
          <span className="compare-page__pane-meta">{src.split('/').pop()}</span>
        </div>
      </div>
      <div className={`compare-page__viewport${mobile ? ' compare-page__viewport--mobile' : ''}`}>
        <img
          alt={label}
          className={`compare-page__image${mobile ? ' compare-page__image--mobile' : ''}`}
          src={cacheSafeSrc}
        />
      </div>
    </section>
  );
}

function MissingPane() {
  return (
    <section className="compare-page__surface compare-page__pane">
      <div className="compare-page__pane-head">
        <div>
          <strong className="compare-page__pane-title">Rendu actuel</strong>
          <span className="compare-page__pane-meta">capture non disponible pour le moment</span>
        </div>
      </div>
      <div className="compare-page__missing">
        <div className="compare-page__missing-card">
          <strong className="compare-page__missing-title">Capture actuelle a produire</strong>
          <p className="compare-page__missing-text">
            Cette page a deja sa maquette de reference. La capture du rendu courant pourra etre ajoutee des que
            l ecran existera dans l app.
          </p>
        </div>
      </div>
    </section>
  );
}

function CompareLivePane({ label, src, viewport }: { label: string; src: string; viewport: 'desktop' | 'mobile' }) {
  const liveSrc = `${src}${src.includes('?') ? '&' : '?'}compare=1&v=${Date.now()}`;
  const mobile = viewport === 'mobile';

  return (
    <section className="compare-page__surface compare-page__pane">
      <div className="compare-page__pane-head">
        <div>
          <strong className="compare-page__pane-title">{label}</strong>
          <span className="compare-page__pane-meta">vue live</span>
        </div>
      </div>
      <div className={`compare-page__viewport${mobile ? ' compare-page__viewport--mobile' : ''}`}>
        <iframe
          className={`compare-page__frame${mobile ? ' compare-page__frame--mobile' : ''}`}
          key={liveSrc}
          src={liveSrc}
          title={label}
        />
      </div>
    </section>
  );
}

function CompareNavSection({ title, links, active }: { title: string; links: CompareLink[]; active: CompareRouteName }) {
  return (
    <div className="compare-page__nav-section">
      <span className="compare-page__nav-title">{title}</span>
      <div className="compare-page__nav-links">
        {links.map((link) => (
          <a className={`compare-page__nav-link${link.key === active ? ' is-active' : ''}`} href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function ComparePage({ route }: ComparePageProps) {
  const config = compareConfigs[route.name];

  return (
    <main className="compare-page">
      <section className="compare-page__surface compare-page__topbar">
        <div className="compare-page__topbar-head">
          <div>
            <h1 className="compare-page__title">{config.title}</h1>
            <p className="compare-page__description">{config.description}</p>
          </div>
          <div className="compare-page__nav-stack">
            <CompareNavSection active={config.active} links={desktopCompareLinks} title="Desktop" />
            <CompareNavSection active={config.active} links={mobileCompareLinks} title="Mobile" />
          </div>
        </div>
      </section>

      <section className="compare-page__grid">
        <ComparePane label="Maquette" src={config.mockup} viewport={config.viewport} />
        {config.liveSrc ? (
          <CompareLivePane label="Rendu actuel" src={config.liveSrc} viewport={config.viewport} />
        ) : config.current ? (
          <ComparePane label="Rendu actuel" src={config.current} viewport={config.viewport} />
        ) : (
          <MissingPane />
        )}
      </section>
    </main>
  );
}

export { ComparePage };
export default ComparePage;
