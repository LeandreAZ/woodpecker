import { useState } from 'react';
import * as AppIcons from '../../shared/AppIcons';
import { PageHeader, Stat } from './TrainingsViewPrimitives';
import { formatDateTime, formatDuration } from './trainingsUtils';
import type {
  HistoryOverview,
  StatsOverview,
  Training,
  TrainingAttemptHistory,
  TrainingCycleHistory,
  TrainingDashboardSummary,
  UserSettingsOverview,
  View,
} from './trainingsTypes';

function truncate(value?: string | null, maxLength = 88) {
  const normalized = value?.trim() ?? '';
  if (!normalized) {
    return 'Aucune description pour le moment.';
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function getTrainingIcon(training: Training) {
  const icon = training.icon ?? 'queen';
  switch (icon) {
    case 'knight':
      return 'N';
    case 'bishop':
      return 'B';
    case 'rook':
      return 'R';
    case 'pawn':
      return 'P';
    default:
      return <AppIcons.QueenIcon />;
  }
}

function buildFallbackSummaries(trainings: Training[]): TrainingDashboardSummary[] {
  return trainings.map((training) => ({
    attemptCount: 0,
    descriptionReady: Boolean(training.description?.trim()),
    failedCount: 0,
    hasResumableCycle: false,
    latestAttemptedAt: null,
    latestCycleNumber: null,
    latestCycleStatus: null,
    pendingCount: 0,
    progressPercent: 0,
    puzzleCount: 0,
    solvedCount: 0,
    training,
  }));
}

function getTopStats(summaries: TrainingDashboardSummary[]) {
  const activeCount = summaries.filter((summary) => summary.latestCycleStatus === 'active' || summary.hasResumableCycle).length;
  const completedCount = summaries.filter((summary) => summary.latestCycleStatus === 'completed').length;
  const streakCount = summaries.filter((summary) => Boolean(summary.latestAttemptedAt)).length > 0 ? 1 : 0;
  const globalProgress = summaries.length
    ? Math.round(summaries.reduce((total, summary) => total + summary.progressPercent, 0) / summaries.length)
    : 0;

  return [
    { icon: AppIcons.TargetIcon, tone: 'blue', label: 'Entraînements actifs', value: String(activeCount) },
    { icon: AppIcons.CheckCircleIcon, tone: 'green', label: 'Entraînements terminés', value: String(completedCount) },
    { icon: AppIcons.FlameIcon, tone: 'blue', label: 'Série actuelle', value: String(streakCount) },
    { icon: AppIcons.TrendUpIcon, tone: 'green', label: 'Progression globale', value: `${globalProgress}%` },
  ];
}

function getGlobalRows(statsOverview: StatsOverview | null, summaries: TrainingDashboardSummary[]) {
  const averageProgress = summaries.length
    ? Math.round(summaries.reduce((total, summary) => total + summary.progressPercent, 0) / summaries.length)
    : 0;
  const trainingTime = formatDuration((statsOverview?.attemptCount ?? 0) * 90 * 1000);
  const perSession = statsOverview?.activeCycleCount
    ? Math.round((statsOverview.solvedCyclePuzzleCount + statsOverview.failedCyclePuzzleCount) / statsOverview.activeCycleCount)
    : 0;

  return [
    { icon: AppIcons.TargetIcon, label: 'Taux de réussite', value: `${Math.round(statsOverview?.successRate ?? 0)}%`, delta: `+${Math.round(statsOverview?.successRate ?? 0)}%` },
    { icon: AppIcons.TrendUpIcon, label: 'Progression moyenne', value: `${averageProgress}%`, delta: `+${summaries.length}` },
    { icon: AppIcons.HistoryIcon, label: "Temps d'entraînement", value: trainingTime, delta: `+${trainingTime}` },
    { icon: AppIcons.RepeatIcon, label: 'Tentatives moyennes', value: (statsOverview?.averageMistakes ?? 0).toFixed(1), delta: `+${(statsOverview?.averageMistakes ?? 0).toFixed(1)}` },
    { icon: AppIcons.BarsIcon, label: 'Problèmes par session', value: String(perSession), delta: `+${perSession}` },
  ];
}

function getLatestSessionLabel(summary: TrainingDashboardSummary) {
  if (!summary.latestAttemptedAt) {
    return 'Aucune date';
  }
  return formatDateTime(summary.latestAttemptedAt);
}

export function DashboardView({
  dashboardSummaries,
  deleteTrainingMutation,
  errorMessage,
  isError,
  isSummariesLoading,
  isTrainingsLoading,
  onCreate,
  onOpenTraining,
  selectedTrainingIri,
  statsOverview,
  trainings,
}: {
  dashboardSummaries: TrainingDashboardSummary[];
  deleteTrainingMutation: { mutate: (trainingIri: string) => void; isPending: boolean };
  errorMessage?: string;
  isError: boolean;
  isSummariesLoading: boolean;
  isTrainingsLoading: boolean;
  onCreate: () => void;
  onOpenTraining: (trainingIri: string, view?: View) => void;
  selectedTrainingIri: string | null;
  statsOverview: StatsOverview | null;
  trainings: Training[];
}) {
  const [openActionsTrainingIri, setOpenActionsTrainingIri] = useState<string | null>(null);
  const visibleSummaries = dashboardSummaries.length > 0 ? dashboardSummaries : buildFallbackSummaries(trainings);
  const selectedSummary = visibleSummaries.find((summary) => summary.training['@id'] === selectedTrainingIri) ?? visibleSummaries[0] ?? null;
  const displayedSummaries = visibleSummaries.slice(0, 3);
  const hasMoreTrainings = visibleSummaries.length > 3;
  const showLoading = isTrainingsLoading && trainings.length === 0;
  const showError = isError && Boolean(errorMessage) && visibleSummaries.length === 0;

  if (showLoading) {
    return (
      <div className="wp-page wp-dashboard-v6">
        <p className="wp-empty">Chargement des entraînements...</p>
      </div>
    );
  }

  return (
    <div className="wp-page wp-dashboard-v6 wp-dashboard-v6--fit">
      <section className="wp-dashboard-v6__hero">
        <div>
          <h1>Mes entraînements</h1>
          <p>Entraînements basés sur la méthode Woodpecker.</p>
        </div>
        <button className="wp-dashboard-v6__create" type="button" onClick={onCreate}>
          <span>+</span>
          <span>Créer un entraînement</span>
        </button>
      </section>

      {showError ? <p className="wp-empty">Certaines données sont temporairement indisponibles.</p> : null}

      <section className="wp-dashboard-v6__summary-row wp-dashboard-v6__summary-row--tight">
        {getTopStats(visibleSummaries).map((item) => {
          const Icon = item.icon;
          return (
            <article className="wp-dashboard-v6__metric-card wp-dashboard-v6__metric-card--compact" key={item.label}>
              <div className="wp-dashboard-v6__metric-head wp-dashboard-v6__metric-head--inline">
                <div className={`wp-dashboard-v6__metric-icon ${item.tone}`}><Icon /></div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="wp-dashboard-v6__middle-grid">
        <article className="wp-dashboard-v6__feature-card wp-dashboard-v6__feature-card--selected">
          <div className="wp-dashboard-v6__card-head">
            <h2>Entraînement sélectionné</h2>
          </div>
          {selectedSummary ? (
            <>
              <div className="wp-dashboard-v6__feature-top wp-dashboard-v6__feature-top--selected">
                <div className="wp-dashboard-v6__training-badge">{getTrainingIcon(selectedSummary.training)}</div>
                <div className="wp-dashboard-v6__feature-copy wp-dashboard-v6__feature-copy--selected">
                  <strong>{selectedSummary.training.name}</strong>
                  <span>{truncate(selectedSummary.training.description, 120)}</span>
                </div>
              </div>

              <div className="wp-dashboard-v6__progress-wrap">
                <div className="wp-dashboard-v6__progress-line">
                  <span style={{ width: `${selectedSummary.progressPercent}%` }} />
                </div>
                <div className="wp-dashboard-v6__progress-meta">{selectedSummary.progressPercent}%</div>
              </div>

              <div className="wp-dashboard-v6__feature-stats">
                {[
                  ['Problèmes', String(selectedSummary.puzzleCount)],
                  ['Résolus', `${selectedSummary.solvedCount} (${selectedSummary.progressPercent}%)`],
                  ['À revoir', String(selectedSummary.failedCount)],
                  ['Restants', String(selectedSummary.pendingCount)],
                  ['Tentatives moy.', selectedSummary.puzzleCount > 0 ? (selectedSummary.attemptCount / selectedSummary.puzzleCount).toFixed(1) : '0'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <label>{label}</label>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <div className="wp-dashboard-v6__feature-actions">
                <button className="wp-dashboard-v6__primary-button wp-dashboard-v6__primary-button--sharp" type="button" onClick={() => onOpenTraining(selectedSummary.training['@id'], 'detail')}>
                  Continuer l'entraînement &gt;
                </button>
                <button className="wp-dashboard-v6__secondary-button wp-dashboard-v6__secondary-button--sharp" type="button" onClick={() => onOpenTraining(selectedSummary.training['@id'], 'detail')}>
                  Voir le détail &gt;
                </button>
              </div>
            </>
          ) : (
            <p className="wp-empty">Aucun entraînement sélectionné.</p>
          )}
        </article>

        <article className="wp-dashboard-v6__stats-card">
          <div className="wp-dashboard-v6__card-head">
            <h2>Statistiques globales</h2>
          </div>
          <div className="wp-dashboard-v6__stat-rows wp-dashboard-v6__stat-rows--simple">
            {getGlobalRows(statsOverview, visibleSummaries).map((item) => {
              const Icon = item.icon;
              return (
                <div className="wp-dashboard-v6__stat-row wp-dashboard-v6__stat-row--simple" key={item.label}>
                  <div className="wp-dashboard-v6__stat-label">
                    <span className="wp-dashboard-v6__stat-icon"><Icon /></span>
                    <span>{item.label}</span>
                  </div>
                  <strong>{item.value}</strong>
                  <small>{item.delta}</small>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className={`wp-dashboard-v6__trainings-card wp-dashboard-v6__trainings-card--minimal ${displayedSummaries.length <= 2 ? 'wp-dashboard-v6__trainings-card--compact' : ''}`}>
        <div className="wp-dashboard-v6__trainings-head wp-dashboard-v6__trainings-head--minimal">
          <h2>Mes entraînements</h2>
          {hasMoreTrainings ? (
            <button className="wp-dashboard-v6__secondary-button wp-dashboard-v6__secondary-button--mini wp-dashboard-v6__secondary-button--sharp" type="button" onClick={() => onOpenTraining(visibleSummaries[3].training['@id'], 'detail')}>
              Voir plus &gt;
            </button>
          ) : null}
        </div>

        <div className="wp-dashboard-v6__training-rows wp-dashboard-v6__training-rows--minimal">
          {displayedSummaries.map((summary, index) => (
            <article className="wp-dashboard-v6__training-row wp-dashboard-v6__training-row--minimal wp-dashboard-v6__training-row--inline" key={summary.training['@id']}>
              <button className="wp-dashboard-v6__training-main" type="button" onClick={() => onOpenTraining(summary.training['@id'], 'detail')}>
                <span className={`wp-dashboard-v6__training-icon tone-${(index % 5) + 1}`}>{getTrainingIcon(summary.training)}</span>
                <span className="wp-dashboard-v6__training-copy">
                  <strong>{summary.training.name}</strong>
                  <small>{truncate(summary.training.description)}</small>
                </span>
              </button>

              <div className="wp-dashboard-v6__training-progress wp-dashboard-v6__training-progress--inline wp-dashboard-v6__training-progress--with-percent">
                <div className="wp-dashboard-v6__training-bar"><span style={{ width: `${summary.progressPercent}%` }} /></div>
                <span className="wp-dashboard-v6__training-percent">{summary.progressPercent}%</span>
              </div>

              <div className="wp-dashboard-v6__training-end">
                <span className="wp-dashboard-v6__training-session">{getLatestSessionLabel(summary)}</span>
                <button
                  className="wp-dashboard-v6__more"
                  type="button"
                  aria-label={`Options pour ${summary.training.name}`}
                  onClick={() => setOpenActionsTrainingIri((current) => current === summary.training['@id'] ? null : summary.training['@id'])}
                >
                  <AppIcons.MoreIcon />
                </button>
                {openActionsTrainingIri === summary.training['@id'] ? (
                  <div className="wp-dashboard-v6__more-menu">
                    <button type="button" onClick={() => { setOpenActionsTrainingIri(null); onOpenTraining(summary.training['@id'], 'detail'); }}>
                      Modifier
                    </button>
                    <button
                      type="button"
                      disabled={deleteTrainingMutation.isPending}
                      onClick={() => {
                        setOpenActionsTrainingIri(null);
                        deleteTrainingMutation.mutate(summary.training['@id']);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {isSummariesLoading ? <p className="wp-empty">Mise à jour des statistiques...</p> : null}
      </section>
    </div>
  );
}

export function CreateTrainingView({
  description,
  errorMessage,
  icon,
  isError,
  isPending,
  name,
  onDescriptionChange,
  onIconChange,
  onNameChange,
  onSubmit,
}: {
  description: string;
  errorMessage?: string;
  icon: string;
  isError: boolean;
  isPending: boolean;
  name: string;
  onDescriptionChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="wp-page narrow">
      <PageHeader eyebrow="Création" title="Créer un entraînement" description="Donne un nom clair à ton set et ajoute une description simple." />
      <form className="wp-form-card" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <label>
          Titre de l'entraînement
          <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Ex : Mat en 2" />
        </label>
        <label>
          Icône de l'entraînement
          <select value={icon} onChange={(event) => onIconChange(event.target.value)}>
            <option value="queen">Reine</option>
            <option value="knight">Cavalier</option>
            <option value="bishop">Fou</option>
            <option value="rook">Tour</option>
            <option value="pawn">Pion</option>
          </select>
        </label>
        <label>
          Description
          <textarea rows={5} value={description} onChange={(event) => onDescriptionChange(event.target.value)} />
        </label>
        {isError && errorMessage ? <p className="wp-empty">Une partie des données est temporairement indisponible.</p> : null}
        <button className="wp-primary" disabled={isPending || !name.trim()} type="submit">
          {isPending ? 'Création...' : "Créer l'entraînement"}
        </button>
      </form>
    </div>
  );
}

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

export function StatsOverviewView({
  errorMessage,
  isError,
  isLoading,
  onOpenTraining,
  statsOverview,
}: {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  onOpenTraining: (trainingIri: string, view?: View) => void;
  statsOverview: StatsOverview | null;
}) {
  return (
    <div className="wp-page">
      <PageHeader eyebrow="Statistiques" title="Statistiques globales" description="Vue d'ensemble des performances et des entraînements." />
      {isLoading ? <p className="wp-empty">Chargement des statistiques...</p> : null}
      {isError && errorMessage ? <p className="wp-empty">Une partie des données est temporairement indisponible.</p> : null}
      {statsOverview ? (
        <section className="wp-dashboard-overview">
          <Stat label="Entraînements" value={String(statsOverview.trainingCount)} />
          <Stat label="Puzzles" value={String(statsOverview.puzzleCount)} />
          <Stat label="Tentatives" value={String(statsOverview.attemptCount)} />
          <Stat label="Réussite" value={`${Math.round(statsOverview.successRate)}%`} />
          <Stat label="Cycles actifs" value={String(statsOverview.activeCycleCount)} />
        </section>
      ) : null}
      {statsOverview && statsOverview.trainingBreakdown.length > 0 ? (
        <section className="wp-panel">
          {statsOverview.trainingBreakdown.map((summary) => (
            <button key={summary.training['@id']} className="wp-list-row" type="button" onClick={() => onOpenTraining(summary.training['@id'], 'detail')}>
              <span>{summary.training.name}</span>
              <strong>{summary.progressPercent}%</strong>
            </button>
          ))}
        </section>
      ) : null}
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
          <Stat label="Volume quotidien" value={String(settingsOverview.preferencesPreview.defaultMistakeLimit)} />
          <Stat label="Rappels" value={settingsOverview.preferencesPreview.trackedSolverByDefault ? 'Actifs' : 'Inactifs'} />
        </section>
      ) : null}
    </div>
  );
}



