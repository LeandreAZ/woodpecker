import { PageHeader, Stat } from './TrainingsViewPrimitives';
import { formatDateTime } from './trainingsUtils';
import type {
  HistoryOverview,
  Training,
  TrainingAttemptHistory,
  TrainingCycleHistory,
  UserSettingsOverview,
  View,
} from './trainingsTypes';

export function ImportView({
  csvErrors,
  csvFileName,
  csvRows,
  errorMessage,
  isError,
  isPending,
  onBackToDashboard,
  onResetFile,
  onSubmit,
  puzzleListIsLocked,
  selectedTraining,
}: {
  csvErrors: string[];
  csvFileName: string;
  csvRows: { fen: string | null; solution: string[]; themes: string[]; rating: number | null; personalNote: string | null; }[];
  errorMessage?: string;
  isError: boolean;
  isPending: boolean;
  onBackToDashboard: () => void;
  onFileParsed: (fileName: string, rows: { fen: string | null; solution: string[]; themes: string[]; rating: number | null; personalNote: string | null; }[], errors: string[]) => void;
  onResetFile: () => void;
  onSubmit: () => void;
  puzzleListIsLocked: boolean;
  selectedTraining: Training | null;
}) {
  return (
    <div className="wp-page narrow">
      <PageHeader
        eyebrow="Import"
        title="Importer des puzzles"
        description={`Ajoute des puzzles à ${selectedTraining?.name ?? "l'entraînement sélectionné"}.`}
      />
      {puzzleListIsLocked ? <p className="alert error-alert">La collection est verrouillée tant qu'un cycle est actif.</p> : null}
      <div className="wp-panel">
        <p>{`Fichier sélectionné : ${csvFileName || 'Aucun fichier'}`}</p>
        <p>{`${csvRows.length} ligne(s) prêtes`}</p>
        <p>{`${csvErrors.length} erreur(s) détectée(s)`}</p>
        {isError && errorMessage ? <p className="wp-empty">Une partie des données est temporairement indisponible.</p> : null}
        <div className="wp-inline-actions">
          <button className="wp-secondary" type="button" onClick={onBackToDashboard}>Retour</button>
          <button className="wp-secondary" type="button" onClick={onResetFile}>Réinitialiser</button>
          <button className="wp-primary" disabled={isPending || puzzleListIsLocked} type="button" onClick={onSubmit}>
            {isPending ? 'Import...' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function HistoryOverviewView({
  attemptHistory,
  cycleHistory,
  detailedErrorMessage,
  errorMessage,
  historyOverview,
  isDetailedError,
  isDetailedLoading,
  isError,
  isLoading,
  onOpenTraining,
}: {
  attemptHistory: TrainingAttemptHistory | null;
  cycleHistory: TrainingCycleHistory | null;
  detailedErrorMessage?: string;
  errorMessage?: string;
  historyOverview: HistoryOverview | null;
  isDetailedError: boolean;
  isDetailedLoading: boolean;
  isError: boolean;
  isLoading: boolean;
  onBackToDashboard: () => void;
  onOpenTraining: (trainingIri: string, view?: View) => void;
  selectedTraining: Training | null;
}) {
  return (
    <div className="wp-page">
      <PageHeader eyebrow="Historique" title="Historique" description="Cycles récents et dernières tentatives." />
      {isLoading ? <p className="wp-empty">Chargement de l'historique...</p> : null}
      {isError && errorMessage ? <p className="wp-empty">Une partie des données est temporairement indisponible.</p> : null}
      {isDetailedError && detailedErrorMessage ? <p className="wp-empty">Le détail complet est temporairement indisponible.</p> : null}
      {historyOverview ? (
        <section className="wp-dashboard-overview">
          <Stat label="Tentatives" value={String(historyOverview.attemptCount)} />
          <Stat label="Cycles" value={String(historyOverview.cycleCount)} />
          <Stat label="Réussites" value={String(historyOverview.successfulAttemptCount)} />
          <Stat label="Échecs" value={String(historyOverview.failedAttemptCount)} />
        </section>
      ) : null}
      {isDetailedLoading ? <p className="wp-empty">Chargement détaillé...</p> : null}
      {cycleHistory && cycleHistory.cycles.length > 0 ? (
        <section className="wp-panel">
          {cycleHistory.cycles.map((item) => (
            <button key={item.cycle['@id']} className="wp-list-row" type="button" onClick={() => onOpenTraining(cycleHistory.training['@id'], 'detail')}>
              <span>{cycleHistory.training.name}</span>
              <strong>{item.progressPercent}%</strong>
            </button>
          ))}
        </section>
      ) : null}
      {attemptHistory && attemptHistory.attempts.length > 0 ? (
        <section className="wp-panel">
          {attemptHistory.attempts.slice(0, 10).map((item) => (
            <div key={item['@id']} className="wp-list-row">
              <span>{item.successful ? 'Réussi' : 'Échoué'}</span>
              <strong>{item.attemptedAt ? formatDateTime(item.attemptedAt) : 'Sans date'}</strong>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

export function SettingsOverviewView({
  errorMessage,
  isError,
  isLoading,
  settingsOverview,
}: {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  onBackToDashboard: () => void;
  settingsOverview: UserSettingsOverview | null;
}) {
  return (
    <div className="wp-page narrow">
      <PageHeader eyebrow="Paramètres" title="Compte et préférences" description="État du compte et réglages généraux." />
      {isLoading ? <p className="wp-empty">Chargement des paramètres...</p> : null}
      {isError && errorMessage ? <p className="wp-empty">Une partie des données est temporairement indisponible.</p> : null}
      {settingsOverview ? (
        <section className="wp-dashboard-overview">
          <Stat label="Méthode" value="Woodpecker" />
          <Stat label="Langue" value={settingsOverview.preferences.language || 'fr'} />
          <Stat label="Fuseau" value={settingsOverview.preferences.timezone || 'Europe/Paris'} />
          <Stat label="Connexions actives" value={String(settingsOverview.connectedProviders.filter((provider) => provider.connected).length)} />
        </section>
      ) : null}
    </div>
  );
}








