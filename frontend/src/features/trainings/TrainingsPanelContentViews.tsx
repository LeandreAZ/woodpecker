import TrainingsHistoryView from './TrainingsHistoryView';
import TrainingsSettingsView from './TrainingsSettingsView';
import { PageHeader, Stat } from './TrainingsViewPrimitives';
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
  errorMessage,
  historyOverview,
  isError,
  isLoading,
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
  return <TrainingsHistoryView errorMessage={errorMessage} historyOverview={historyOverview} isError={isError} isLoading={isLoading} />;
}

export function SettingsOverviewView({
  errorMessage,
  isError,
  isLoading,
  isSaving,
  onSave,
  saveErrorMessage,
  settingsOverview,
}: {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onBackToDashboard: () => void;
  onSave: (value: {
    appearance: UserSettingsOverview['appearance'];
    board: Pick<UserSettingsOverview['board'], 'darkSquareColor' | 'lightSquareColor'>;
    profile: Pick<UserSettingsOverview['profile'], 'displayName'>;
    solverPreferences: UserSettingsOverview['solverPreferences'];
  }) => Promise<unknown>;
  saveErrorMessage?: string;
  settingsOverview: UserSettingsOverview | null;
}) {
  if (!settingsOverview && !isLoading && !isError) {
    return (
      <div className="wp-page narrow">
        <PageHeader eyebrow="Paramètres" title="Paramètres" description="Gérez votre profil et personnalisez votre expérience Woodpecker." />
        <p className="wp-empty">Aucun paramètre disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <TrainingsSettingsView
      errorMessage={errorMessage}
      isError={isError}
      isLoading={isLoading}
      isSaving={isSaving}
      onSave={onSave}
      saveErrorMessage={saveErrorMessage}
      settingsOverview={settingsOverview}
    />
  );
}
