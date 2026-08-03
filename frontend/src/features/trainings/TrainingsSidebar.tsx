import type { AuthSession } from '../auth/authStorage';
import { NavButton } from './TrainingsViewPrimitives';
import type { CycleStats, Training, View } from './trainingsTypes';

type TrainingsSidebarProps = {
  activeView: View;
  currentCycleStatusLabel: string;
  cycleStats: CycleStats;
  onLogout: () => void;
  onNavigateToView: (view: View) => void;
  selectedPuzzleCount: number;
  selectedTraining: Training | null;
  session: AuthSession;
};

export function TrainingsSidebar({
  activeView,
  currentCycleStatusLabel,
  cycleStats,
  onLogout,
  onNavigateToView,
  selectedPuzzleCount,
  selectedTraining,
  session,
}: TrainingsSidebarProps) {
  return (
    <aside className="wp-sidebar">
      <div className="wp-logo">
        <span className="wp-logo-icon">WP</span>
        <div>
          <strong>Woodpecker</strong>
          <span>Trainer</span>
        </div>
      </div>

      <nav className="wp-nav" aria-label="Navigation principale">
        <NavButton active={activeView === 'dashboard'} onClick={() => onNavigateToView('dashboard')}>Tableau de bord</NavButton>
        <NavButton active={activeView === 'detail'} onClick={() => onNavigateToView('detail')}>Mes entrainements</NavButton>
        <NavButton active={activeView === 'create'} onClick={() => onNavigateToView('create')}>Creer</NavButton>
        <NavButton active={activeView === 'import'} onClick={() => onNavigateToView('import')}>Import CSV</NavButton>
        <NavButton active={activeView === 'solver'} onClick={() => onNavigateToView('solver')}>Solveur</NavButton>
      </nav>

      <div className="wp-sidebar-summary">
        <p className="wp-sidebar-label">Session active</p>
        <strong>{selectedTraining ? selectedTraining.name : 'Aucun entrainement ouvert'}</strong>
        <p>{selectedTraining ? selectedTraining.description || 'Set pret a etre travaille dans le detail ou le solveur.' : 'Ouvre un training pour retrouver ici son contexte rapide.'}</p>
        <div className="wp-sidebar-metrics">
          <span>{selectedTraining ? `${selectedPuzzleCount} puzzle(s)` : '0 puzzle'}</span>
          <span>{selectedTraining ? `${cycleStats.progressPercent}% progression` : '0% progression'}</span>
          <span>{selectedTraining ? currentCycleStatusLabel : 'Cycle inactif'}</span>
        </div>
      </div>

      <div className="wp-sidebar-footer">
        <span>{session.email}</span>
        <button type="button" onClick={onLogout}>Deconnexion</button>
      </div>
    </aside>
  );
}
