import { useState } from 'react';
import * as AppIcons from '../../shared/AppIcons';
import { parsePuzzleCsv, type PuzzleCsvRow } from './csvImport';
import { PageHeader, Stat } from './TrainingsViewPrimitives';
import { formatDateTime, formatDuration, getCycleStatusLabel } from './trainingsUtils';
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

function buildFallbackDashboardSummaries(trainings: Training[]): TrainingDashboardSummary[] {
  return trainings.map((training) => ({
    attemptCount: 0,
    descriptionReady: Boolean(training.description?.trim().length),
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

function cycleStatusLabel(summary: TrainingDashboardSummary) {
  if (summary.latestCycleStatus === 'active' && summary.hasResumableCycle) {
    return `Cycle ${summary.latestCycleNumber} actif`;
  }

  if (summary.latestCycleStatus === 'completed') {
    return `Cycle ${summary.latestCycleNumber} termine`;
  }

  if (summary.latestCycleNumber) {
    return `Cycle ${summary.latestCycleNumber} prepare`;
  }

  return 'Aucun cycle';
}

function getAttemptStateLabel(successful: boolean) {
  return successful ? 'Reussi' : 'À revoir';
}

function getIntegrationLabel(connected: boolean) {
  return connected ? 'Connecte' : 'A preparer';
}


function truncateTrainingDescription(value?: string | null, maxLength = 52) {
  const normalized = value?.trim() ?? '';

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}?`;
}

function getTrainingIconName(training: Training): string {
  return training.icon ?? 'queen';
}

function renderTrainingIcon(iconName: string) {
  switch (iconName) {
    case 'knight':
      return <AppIcons.KnightIcon />;
    case 'bishop':
      return <AppIcons.BishopIcon />;
    case 'rook':
      return <AppIcons.RookIcon />;
    case 'pawn':
      return <AppIcons.PawnIcon />;
    case 'queen':
    default:
      return <AppIcons.QueenIcon />;
  }
}

function formatRecentActivityTime(value?: string | null) {
  if (!value) {
    return 'A l instant';
  }

  const now = new Date('2026-08-11T12:00:00+02:00').getTime();
  const then = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((now - then) / 60000));

  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

export function DashboardView({ dashboardSummaries, errorMessage, isError, isLoading, onCreate, onOpenTraining, selectedTrainingIri, trainings }: { dashboardSummaries: TrainingDashboardSummary[]; errorMessage?: string; isError: boolean; isLoading: boolean; onCreate: () => void; onOpenTraining: (trainingIri: string, view?: View) => void; selectedTrainingIri: string | null; trainings: Training[]; }) {
  const selectedTraining = trainings.find((training) => training['@id'] === selectedTrainingIri) ?? null;
  const trainingsWithDescription = trainings.filter((training) => training.description?.trim().length).length;
  const resumableCount = dashboardSummaries.filter((summary) => summary.hasResumableCycle).length;

  return (
    <div className="wp-page">
      <PageHeader eyebrow="Tableau de bord" title="Mes entrainements" description="Reprends un cycle, cree un nouvel entrainement ou ouvre directement le solveur." action={<button className="wp-primary" type="button" onClick={onCreate}>+ Creer un entrainement</button>} />
      {trainings.length > 0 && <section className="wp-dashboard-overview"><Stat label="Entrainements" value={String(trainings.length)} /><Stat label="Selection active" value={selectedTraining ? selectedTraining.name : 'Aucune'} /><Stat label="Cycles a reprendre" value={String(resumableCount)} /><Stat label="Descriptifs remplis" value={String(trainingsWithDescription)} /></section>}
      {isLoading && <p className="wp-empty">Chargement des entrainements...</p>}
      {isError && <p className="alert error-alert">{errorMessage}</p>}
      {!isLoading && trainings.length === 0 && <div className="wp-empty-card"><h3>Aucun entrainement pour l'instant</h3><p>Cree ton premier set Woodpecker, puis ajoute des puzzles manuellement ou via CSV.</p><button className="wp-primary" type="button" onClick={onCreate}>Creer le premier entrainement</button></div>}
      {dashboardSummaries.length > 0 && <div className="wp-training-grid">{dashboardSummaries.map((summary) => { const training = summary.training; return <article className={training['@id'] === selectedTrainingIri ? 'wp-training-card selected' : 'wp-training-card'} key={training['@id']}><div className="wp-card-copy"><div className="wp-card-status"><span>{cycleStatusLabel(summary)}</span><small>{training.createdAt ? new Date(training.createdAt).toLocaleDateString('fr-FR') : 'Brouillon'}</small></div><h3>{training.name}</h3><p>{training.description || 'Aucune description pour le moment.'}</p><div className="wp-card-meta dashboard-card-meta"><span>{summary.puzzleCount} puzzle(s)</span><span>{summary.attemptCount} tentative(s)</span><span>{summary.latestAttemptedAt ? `Activite ${new Date(summary.latestAttemptedAt).toLocaleDateString('fr-FR')}` : 'Aucune tentative'}</span></div></div><div className="wp-card-meta"><span>{summary.solvedCount} resolu(s)</span><span>{summary.failedCount} a revoir</span><span>{summary.pendingCount} restant(s)</span></div><div className="wp-progress"><span style={{ width: `${summary.progressPercent}%` }} /></div><div className="wp-card-actions"><button type="button" onClick={() => onOpenTraining(training['@id'], 'detail')}>Ouvrir</button><button type="button" onClick={() => onOpenTraining(training['@id'], 'solver')}>{summary.hasResumableCycle ? 'Reprendre' : 'Solveur'}</button></div></article>; })}</div>}
      {!isLoading && !isError && trainings.length > 0 && dashboardSummaries.length === 0 && <p className="wp-empty">Chargement des resumes du tableau de bord...</p>}
    </div>
  );
}

function getTrainingGlyph(name: string): string {
  const normalized = name.toLowerCase();

  if (normalized.includes('mate') || normalized.includes('mat')) {
    return 'M2';
  }

  if (normalized.includes('theme') || normalized.includes('lichess')) {
    return 'TH';
  }

  if (normalized.includes('finale')) {
    return 'R';
  }

  if (normalized.includes('mixte') || normalized.includes('tactique')) {
    return 'N';
  }

  return 'WP';
}

export function CreateTrainingView({ description, errorMessage, icon, isError, isPending, name, onDescriptionChange, onIconChange, onNameChange, onSubmit }: { description: string; errorMessage?: string; icon: string; isError: boolean; isPending: boolean; name: string; onDescriptionChange: (value: string) => void; onIconChange: (value: string) => void; onNameChange: (value: string) => void; onSubmit: () => void; }) {
  return (
    <div className="wp-page narrow">
      <PageHeader eyebrow="Creation" title="Créer un entraînement" description="Donne un nom clair a ton set. Tu pourras ensuite ajouter ou importer tes puzzles." />
      <form className="wp-form-card" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><label>Titre de l'entraînement<input maxLength={120} onChange={(event) => onNameChange(event.target.value)} placeholder="Ex : Mat en 2 - avance" required value={name} /></label><label>Icône de l'entraînement<select onChange={(event) => onIconChange(event.target.value)} value={icon}><option value="queen">Reine</option><option value="knight">Cavalier</option><option value="bishop">Fou</option><option value="rook">Tour</option><option value="pawn">Pion</option></select></label><label>Description<textarea onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Objectif, niveau, source des puzzles..." rows={6} value={description} /></label>{isError && <p className="alert error-alert">{errorMessage}</p>}<button className="wp-primary" disabled={isPending || name.trim().length === 0} type="submit">{isPending ? 'Création...' : "Créer l'entraînement"}</button></form>
    </div>
  );
}

export function StatsOverviewView({ errorMessage, isError, isLoading, onOpenTraining, statsOverview }: { errorMessage?: string; isError: boolean; isLoading: boolean; onOpenTraining: (trainingIri: string, view?: View) => void; statsOverview: StatsOverview | null; }) {
  const trainingBreakdown = statsOverview?.trainingBreakdown ?? [];

  return (
    <div className="wp-page wp-stats-page">
      <PageHeader
        eyebrow="Statistiques"
        title="Statistiques globales"
        description="Analyse les volumes d entraînement, la réussite et les trainings qui méritent le plus d attention."
      />
      {isLoading && <p className="wp-empty">Chargement des statistiques...</p>}
      {isError && <p className="alert error-alert">{errorMessage}</p>}
      {statsOverview && (
        <>
          <section className="wp-dashboard-overview wp-stats-kpis">
            <Stat label="Trainings" value={String(statsOverview.trainingCount)} />
            <Stat label="Puzzles" value={String(statsOverview.puzzleCount)} />
            <Stat label="Tentatives" value={String(statsOverview.attemptCount)} />
            <Stat label="Reussite" value={`${statsOverview.successRate}%`} />
            <Stat label="Cycles actifs" value={String(statsOverview.activeCycleCount)} />
          </section>

          <div className="wp-detail-overview-grid wp-stats-top-grid">
            <section className="wp-panel wp-detail-highlight wp-stats-trend-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Progression du taux de réussite</p>
                  <h3>Vue d ensemble</h3>
                </div>
              </div>
              <p className="wp-detail-highlight-copy">
                {statsOverview.latestAttemptedAt
                  ? `Derniere activite le ${new Date(statsOverview.latestAttemptedAt).toLocaleDateString('fr-FR')}. ${statsOverview.resumableTrainingCount} training(s) peuvent etre repris immediatement.`
                  : 'Aucune tentative sauvegardee pour le moment. Lance un premier cycle pour alimenter les statistiques.'}
              </p>
              <div className="wp-inline-metrics wp-inline-metrics-spaced">
                <span>{statsOverview.activeCycleCount} cycle(s) actif(s)</span>
                <span>{statsOverview.completedCycleCount} cycle(s) terminés</span>
                <span>{statsOverview.averageMistakes.toFixed(1)} erreur(s) / tentative</span>
              </div>
              <div className="wp-stats-visual-bar">
                <span style={{ width: `${Math.max(8, statsOverview.successRate)}%` }} />
              </div>
            </section>

            <section className="wp-panel wp-stats-donut-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Repartition des puzzles</p>
                  <h3>Etat cumule</h3>
                </div>
              </div>
              <div className="wp-stats-split-metrics">
                <div>
                  <span>Résolus</span>
                  <strong>{statsOverview.solvedCyclePuzzleCount}</strong>
                </div>
                <div>
                  <span>À revoir</span>
                  <strong>{statsOverview.failedCyclePuzzleCount}</strong>
                </div>
                <div>
                  <span>Restants</span>
                  <strong>{statsOverview.pendingCyclePuzzleCount}</strong>
                </div>
              </div>
            </section>
          </div>

          <section className="wp-panel wp-stats-focus-panel">
            <div className="wp-panel-title with-action">
              <div>
                <p className="eyebrow">Trainings</p>
                <h3>Ou concentrer la reprise</h3>
              </div>
            </div>
            {trainingBreakdown.length === 0 && <p className="wp-empty">Aucun training n alimente encore les statistiques globales.</p>}
            {trainingBreakdown.length > 0 && (
              <div className="wp-stats-training-list">
                {trainingBreakdown.map((summary) => {
                  const training = summary.training;
                  return (
                    <article className="wp-stats-training-row" key={training['@id']}>
                      <div className="wp-stats-training-main">
                        <div className="wp-stats-training-badge">{getTrainingGlyph(training.name)}</div>
                        <div>
                          <strong>{training.name}</strong>
                          <small>{summary.descriptionReady ? training.description : 'Aucune description pour le moment.'}</small>
                        </div>
                      </div>
                      <div className="wp-stats-training-progress">
                        <div className="wp-progress">
                          <span style={{ width: `${summary.progressPercent}%` }} />
                        </div>
                        <small>{summary.progressPercent}% progression</small>
                      </div>
                      <div className="wp-stats-training-metric">
                        <span>Volume</span>
                        <strong>{summary.puzzleCount}</strong>
                      </div>
                      <div className="wp-stats-training-metric">
                        <span>Tentatives</span>
                        <strong>{summary.attemptCount}</strong>
                      </div>
                      <div className="wp-stats-training-metric">
                        <span>Restants</span>
                        <strong>{summary.pendingCount}</strong>
                      </div>
                      <div className="wp-stats-training-actions">
                        <button type="button" onClick={() => onOpenTraining(training['@id'], 'detail')}>Ouvrir</button>
                        <button type="button" onClick={() => onOpenTraining(training['@id'], summary.hasResumableCycle ? 'solver' : 'detail')}>
                          {summary.hasResumableCycle ? 'Reprendre' : 'Voir le détail'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
export function HistoryOverviewView({ attemptHistory, cycleHistory, detailedErrorMessage, errorMessage, historyOverview, isDetailedError, isDetailedLoading, isError, isLoading, onBackToDashboard, onOpenTraining, selectedTraining }: { attemptHistory: TrainingAttemptHistory | null; cycleHistory: TrainingCycleHistory | null; detailedErrorMessage?: string; errorMessage?: string; historyOverview: HistoryOverview | null; isDetailedError: boolean; isDetailedLoading: boolean; isError: boolean; isLoading: boolean; onBackToDashboard: () => void; onOpenTraining: (trainingIri: string, view?: View) => void; selectedTraining: Training | null; }) {
  const [trainingFilter, setTrainingFilter] = useState<string>('all');
  const [surfaceFilter, setSurfaceFilter] = useState<'all' | 'attempts' | 'cycles'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'active' | 'completed' | 'resumable'>('all');

  const recentCycles = historyOverview?.recentCycles ?? [];
  const recentAttempts = historyOverview?.recentAttempts ?? [];
  const detailedAttempts = attemptHistory?.attempts ?? [];
  const detailedCycles = cycleHistory?.cycles ?? [];
  const trainingOptionMap = new Map<string, (typeof recentCycles)[number]['training']>();

  for (const cycle of recentCycles) {
    trainingOptionMap.set(cycle.training['@id'], cycle.training);
  }

  for (const attempt of recentAttempts) {
    trainingOptionMap.set(attempt.training['@id'], attempt.training);
  }

  const trainingOptions = Array.from(trainingOptionMap.values());

  const visibleAttempts = recentAttempts.filter((attempt) => {
    if (trainingFilter !== 'all' && attempt.training['@id'] !== trainingFilter) {
      return false;
    }
    if (surfaceFilter === 'cycles') {
      return false;
    }
    if (statusFilter === 'success') {
      return attempt.successful;
    }
    if (statusFilter === 'failed') {
      return !attempt.successful;
    }
    if (statusFilter === 'active' || statusFilter === 'completed' || statusFilter === 'resumable') {
      return false;
    }
    return true;
  });

  const visibleCycles = recentCycles.filter((summary) => {
    if (trainingFilter !== 'all' && summary.training['@id'] !== trainingFilter) {
      return false;
    }
    if (surfaceFilter === 'attempts') {
      return false;
    }
    if (statusFilter === 'active') {
      return summary.cycle.status === 'active';
    }
    if (statusFilter === 'completed') {
      return summary.cycle.status === 'completed';
    }
    if (statusFilter === 'resumable') {
      return summary.hasResumableCycle;
    }
    if (statusFilter === 'success' || statusFilter === 'failed') {
      return false;
    }
    return true;
  });

  return (
    <div className="wp-page wp-history-page">
      <PageHeader
        eyebrow="Historique"
        title="Historique détaillé"
        description="Retrouve les cycles recents et les tentatives deja jouees, sans rouvrir chaque training un par un."
        action={<button className="wp-secondary" type="button" onClick={onBackToDashboard}>Retour au tableau de bord</button>}
      />
      {isLoading && <p className="wp-empty">Chargement de l historique...</p>}
      {isError && <p className="alert error-alert">{errorMessage}</p>}
      {historyOverview && (
        <>
          <section className="wp-dashboard-overview wp-history-kpis">
            <Stat label="Tentatives" value={String(historyOverview.attemptCount)} />
            <Stat label="Reussies" value={String(historyOverview.successfulAttemptCount)} />
            <Stat label="Cycles" value={String(historyOverview.cycleCount)} />
            <Stat label="Cycles actifs" value={String(historyOverview.activeCycleCount)} />
          </section>

          <section className="wp-panel wp-history-filter-shell">
            <div className="wp-history-filter-grid">
              <label>
                Training
                <select aria-label="Training" value={trainingFilter} onChange={(event) => setTrainingFilter(event.target.value)}>
                  <option value="all">Tous les trainings</option>
                  {trainingOptions.map((option) => (
                    <option key={option['@id']} value={option['@id']}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Surface
                <select aria-label="Surface" value={surfaceFilter} onChange={(event) => setSurfaceFilter(event.target.value as 'all' | 'attempts' | 'cycles')}>
                  <option value="all">Tout</option>
                  <option value="attempts">Tentatives</option>
                  <option value="cycles">Cycles</option>
                </select>
              </label>
              <label>
                Etat
                <select aria-label="Etat" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'success' | 'failed' | 'active' | 'completed' | 'resumable')}>
                  <option value="all">Tous les etats</option>
                  <option value="success">Tentatives reussies</option>
                  <option value="failed">Tentatives a revoir</option>
                  <option value="active">Cycles actifs</option>
                  <option value="completed">Cycles terminés</option>
                  <option value="resumable">Série actuelle</option>
                </select>
              </label>
              <div className="wp-history-filter-reset">
                <button className="wp-secondary" type="button" onClick={() => { setTrainingFilter('all'); setSurfaceFilter('all'); setStatusFilter('all'); }}>
                  Reinitialiser
                </button>
              </div>
            </div>
          </section>

          <div className="wp-two-columns wp-history-top-columns">
            <section className="wp-panel wp-history-panel">
              <div className="wp-panel-title with-action">
                <div>
                  <p className="eyebrow">Cycles recents</p>
                  <h3>Lecture rapide</h3>
                </div>
              </div>
              {visibleCycles.length === 0 && <p className="wp-empty">Aucun cycle ne correspond aux filtres actuels.</p>}
              {visibleCycles.length > 0 && (
                <div className="wp-cycle-list">
                  {visibleCycles.map((summary) => (
                    <article className="wp-cycle-row" key={summary.cycle['@id']}>
                      <div>
                        <strong>{summary.training.name}</strong>
                        <span>Cycle {summary.cycle.number} - {getCycleStatusLabel(summary.cycle.status)}</span>
                      </div>
                      <div className="wp-cycle-row-progress">
                        <div className="wp-progress">
                          <span style={{ width: `${summary.progressPercent}%` }} />
                        </div>
                        <small>{summary.solved} resolu(s), {summary.failed} a revoir, {summary.pending} restant(s)</small>
                      </div>
                      <div className="wp-cycle-row-meta wp-history-row-actions">
                        <span>{summary.attemptCount} tentative(s)</span>
                        <span>{summary.cycle.startedAt ? `Debut ${formatDateTime(summary.cycle.startedAt)}` : 'Debut inconnu'}</span>
                        <button className="wp-secondary" type="button" onClick={() => onOpenTraining(summary.training['@id'], summary.hasResumableCycle ? 'solver' : 'detail')}>
                          {summary.hasResumableCycle ? 'Reprendre' : 'Ouvrir'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="wp-panel wp-history-panel">
              <div className="wp-panel-title with-action">
                <div>
                  <p className="eyebrow">Tentatives recentes</p>
                  <h3>Dernieres tentatives</h3>
                </div>
              </div>
              {visibleAttempts.length === 0 && <p className="wp-empty">Aucune tentative ne correspond aux filtres actuels.</p>}
              {visibleAttempts.length > 0 && (
                <div className="wp-attempt-list">
                  {visibleAttempts.map((attempt) => (
                    <article className="wp-attempt-row" key={attempt['@id']}>
                      <div>
                        <strong>{attempt.training.name}</strong>
                        <span>{getAttemptStateLabel(attempt.successful)} - Cycle {attempt.cycleNumber ?? '?'} - Puzzle {typeof attempt.trainingPuzzlePosition === 'number' ? attempt.trainingPuzzlePosition + 1 : '?'}</span>
                      </div>
                      <div className="wp-attempt-metrics wp-history-row-actions">
                        <span>{attempt.mistakesCount} erreur(s)</span>
                        <span>{formatDuration(attempt.durationMilliseconds)}</span>
                        <span>{formatDateTime(attempt.attemptedAt)}</span>
                        <button className="wp-secondary" type="button" onClick={() => onOpenTraining(attempt.training['@id'], 'detail')}>
                          Ouvrir
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="wp-panel wp-history-panel wp-history-focus-panel">
            <div className="wp-panel-title with-action">
              <div>
                <p className="eyebrow">Focus training</p>
                <h3>{selectedTraining ? selectedTraining.name : 'Training détaillé'}</h3>
              </div>
              {selectedTraining && <button className="wp-secondary" type="button" onClick={() => onOpenTraining(selectedTraining['@id'], 'detail')}>Ouvrir le training</button>}
            </div>
            {isDetailedLoading && <p className="wp-empty">Chargement du detail du training...</p>}
            {isDetailedError && <p className="alert error-alert">{detailedErrorMessage}</p>}
            {!isDetailedLoading && !isDetailedError && !selectedTraining && <p className="wp-empty">Sélectionne un training pour afficher son historique détaillé.</p>}
            {!isDetailedLoading && !isDetailedError && selectedTraining && (
              <>
                <div className="wp-inline-metrics wp-inline-metrics-spaced">
                  <span>{attemptHistory?.attemptCount ?? 0} tentative(s)</span>
                  <span>{attemptHistory?.successfulAttemptCount ?? 0} reussie(s)</span>
                  <span>{cycleHistory?.cycleCount ?? 0} cycle(s)</span>
                  <span>{cycleHistory?.activeCycleCount ?? 0} actif(s)</span>
                </div>

                <div className="wp-two-columns wp-history-detail-columns">
                  <section className="wp-panel wp-history-subpanel">
                    <div className="wp-panel-title">
                      <div>
                        <p className="eyebrow">Cycle history</p>
                        <h3>Historique du training</h3>
                      </div>
                    </div>
                    {detailedCycles.length === 0 && <p className="wp-empty">Aucun cycle détaillé pour ce training.</p>}
                    {detailedCycles.length > 0 && (
                      <div className="wp-cycle-list">
                        {detailedCycles.map((summary) => (
                          <article className="wp-cycle-row" key={summary.cycle['@id']}>
                            <div>
                              <strong>Cycle {summary.cycle.number}</strong>
                              <span>{getCycleStatusLabel(summary.cycle.status)}</span>
                            </div>
                            <div className="wp-cycle-row-progress">
                              <div className="wp-progress">
                                <span style={{ width: `${summary.progressPercent}%` }} />
                              </div>
                              <small>{summary.solved} resolu(s), {summary.failed} a revoir, {summary.pending} restant(s)</small>
                            </div>
                            <div className="wp-cycle-row-meta">
                              <span>{summary.attemptCount} tentative(s)</span>
                              <span>{summary.latestAttemptedAt ? `Derniere activite ${formatDateTime(summary.latestAttemptedAt)}` : 'Aucune tentative'}</span>
                              <span>{summary.cycle.targetDurationSeconds ? `${summary.cycle.targetDurationSeconds}s cible` : 'Duree libre'}</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="wp-panel wp-history-subpanel">
                    <div className="wp-panel-title">
                      <div>
                        <p className="eyebrow">Attempt history</p>
                        <h3>Tentatives détaillées</h3>
                      </div>
                    </div>
                    {detailedAttempts.length === 0 && <p className="wp-empty">Aucune tentative détaillée pour ce training.</p>}
                    {detailedAttempts.length > 0 && (
                      <div className="wp-attempt-list">
                        {detailedAttempts.map((attempt) => (
                          <article className="wp-attempt-row" key={attempt['@id']}>
                            <div>
                              <strong>{getAttemptStateLabel(attempt.successful)}</strong>
                              <span>Cycle {attempt.cycle.number ?? '?'} - Puzzle {typeof attempt.trainingPuzzle.position === 'number' ? attempt.trainingPuzzle.position + 1 : '?'}</span>
                            </div>
                            <div className="wp-attempt-metrics">
                              <span>{attempt.mistakesCount} erreur(s)</span>
                              <span>{formatDuration(attempt.durationMilliseconds)}</span>
                              <span>{attempt.attemptedAt ? formatDateTime(attempt.attemptedAt) : 'Date inconnue'}</span>
                            </div>
                            <small>{attempt.playedMoves.join(' ')}{attempt.trainingPuzzle.personalNote ? ` - ${attempt.trainingPuzzle.personalNote}` : ''}</small>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
export function SettingsOverviewView({ errorMessage, isError, isLoading, onBackToDashboard, settingsOverview }: { errorMessage?: string; isError: boolean; isLoading: boolean; onBackToDashboard: () => void; settingsOverview: UserSettingsOverview | null; }) {
  return (
    <div className="wp-page wp-settings-page">
      <PageHeader
        eyebrow="Paramètres"
        title="Compte & Preferences"
        description="Gère le profil, les préférences d entraînement et les intégrations a venir."
        action={<button className="wp-secondary" type="button" onClick={onBackToDashboard}>Retour au tableau de bord</button>}
      />
      {isLoading && <p className="wp-empty">Chargement des parametres...</p>}
      {isError && <p className="alert error-alert">{errorMessage}</p>}
      {settingsOverview && (
        <>
          <section className="wp-dashboard-overview wp-settings-kpis">
            <Stat label="Entraînements actifs" value={String(settingsOverview.workspace.activeTrainingCount)} />
            <Stat label="Problèmes" value={String(settingsOverview.workspace.puzzleCount)} />
            <Stat label="Archives" value={String(settingsOverview.workspace.archivedTrainingCount)} />
            <Stat label="Exports" value={settingsOverview.integrations.exportReady ? 'Prets' : 'A venir'} />
          </section>

          <div className="wp-two-columns wp-settings-main-grid">
            <section className="wp-panel wp-settings-profile-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Profil</p>
                  <h3>{settingsOverview.user.email}</h3>
                </div>
              </div>
              <p className="wp-detail-highlight-copy">
                Compte cree {settingsOverview.user.createdAt ? formatDateTime(settingsOverview.user.createdAt) : 'date indisponible'}. Cette base prepare les futurs reglages compte, securite et personnalisation.
              </p>
              <div className="wp-inline-metrics wp-inline-metrics-spaced">
                <span>{settingsOverview.user.roles.join(', ')}</span>
                <span>{settingsOverview.workspace.activeTrainingCount} training(s) actif(s)</span>
                <span>{settingsOverview.workspace.archivedTrainingCount} archive(s)</span>
              </div>
              <div className="wp-import-preview-list">
                <article className="wp-import-preview-row">
                  <strong>Dernier training visible</strong>
                  <small>{settingsOverview.workspace.latestTrainingName ?? 'Aucun training cree pour le moment.'}</small>
                </article>
                <article className="wp-import-preview-row">
                  <strong>Volume courant</strong>
                  <small>{settingsOverview.workspace.trainingCount} training(s) et {settingsOverview.workspace.puzzleCount} puzzle(s) suivis.</small>
                </article>
              </div>
            </section>

            <section className="wp-panel wp-settings-intégrations-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Integrations</p>
                  <h3>Etat de preparation</h3>
                </div>
              </div>
              <div className="wp-settings-integration-list">
                <article className="wp-settings-integration-item">
                  <div>
                    <strong>Lichess</strong>
                    <small>Analyse de parties et synchronisation future.</small>
                  </div>
                  <span className={`wp-status-pill ${settingsOverview.integrations.lichessConnected ? 'success' : 'info'}`}>{getIntegrationLabel(settingsOverview.integrations.lichessConnected)}</span>
                </article>
                <article className="wp-settings-integration-item">
                  <div>
                    <strong>Chess.com</strong>
                    <small>Import de parties et suivi de progression.</small>
                  </div>
                  <span className={`wp-status-pill ${settingsOverview.integrations.chessComConnected ? 'success' : 'info'}`}>{getIntegrationLabel(settingsOverview.integrations.chessComConnected)}</span>
                </article>
                <article className="wp-settings-integration-item">
                  <div>
                    <strong>Exports</strong>
                    <small>Exports et reporting pour la suite produit.</small>
                  </div>
                  <span className={`wp-status-pill ${settingsOverview.integrations.exportReady ? 'success' : 'warning'}`}>{getIntegrationLabel(settingsOverview.integrations.exportReady)}</span>
                </article>
              </div>
            </section>
          </div>

          <div className="wp-two-columns wp-settings-secondary-grid">
            <section className="wp-panel wp-settings-préférences-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Preferences</p>
                  <h3>Base Woodpecker actuelle</h3>
                </div>
              </div>
              <div className="wp-import-preview-list">
                <article className="wp-import-preview-row">
                  <strong>Limite d erreurs de reference</strong>
                  <small>{settingsOverview.preferencesPreview.defaultMistakeLimit} erreur(s) comme point de depart.</small>
                </article>
                <article className="wp-import-preview-row">
                  <strong>Verrouillage des sets</strong>
                  <small>{settingsOverview.preferencesPreview.lockTrainingAfterCycle ? 'Actif par defaut pour garder le meme set pendant un cycle.' : 'Non active.'}</small>
                </article>
                <article className="wp-import-preview-row">
                  <strong>Solveur suivi</strong>
                  <small>{settingsOverview.preferencesPreview.trackedSolverByDefault ? 'Les tentatives sauvegardees sont prioritaires des qu un cycle existe.' : 'Le mode libre reste prioritaire.'}</small>
                </article>
              </div>
            </section>

            <section className="wp-panel wp-settings-workspace-card">
              <div className="wp-panel-title">
                <div>
                  <p className="eyebrow">Etat du compte</p>
                  <h3>Workspace</h3>
                </div>
              </div>
              <div className="wp-import-preview-list">
                <article className="wp-import-preview-row">
                  <strong>Etat export</strong>
                  <small>{settingsOverview.integrations.exportReady ? 'Le socle export est pret a etre branche.' : 'Le socle export reste en preparation.'}</small>
                </article>
                <article className="wp-import-preview-row">
                  <strong>Integrations futures</strong>
                  <small>Cette base servira ensuite aux vrais reglages utilisateur et aux connexions Lichess / Chess.com.</small>
                </article>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
export function FuturePageView({ ctaLabel, description, eyebrow, onBackToDashboard, points, title }: { ctaLabel: string; description: string; eyebrow: string; onBackToDashboard: () => void; points: string[]; title: string; }) {
  return (
    <div className="wp-page">
      <PageHeader eyebrow={eyebrow} title={title} description={description} action={<button className="wp-secondary" type="button" onClick={onBackToDashboard}>Retour au tableau de bord</button>} />
      <div className="wp-detail-overview-grid">
        <section className="wp-panel wp-detail-highlight">
          <div className="wp-panel-title">
            <p className="eyebrow">Bientot</p>
            <h3>Page en preparation</h3>
          </div>
          <p className="wp-detail-highlight-copy">Cette zone fait deja partie du parcours produit cible. On la garde visible pour stabiliser la navigation avant d'y brancher les vraies donnees.</p>
          <div className="wp-inline-metrics">
            <span>Structure produit posee</span>
            <span>Etat placeholder assume</span>
            <span>Donnees a venir</span>
          </div>
        </section>
        <section className="wp-panel wp-detail-highlight subdued">
          <div className="wp-panel-title">
            <p className="eyebrow">Prochain contenu</p>
            <h3>Ce qui arrivera ici</h3>
          </div>
          <div className="wp-import-preview-list">
            {points.map((point) => <article className="wp-import-preview-row" key={point}><strong>{point}</strong><small>Placeholder produit present pour preparer la future implementation.</small></article>)}
          </div>
        </section>
      </div>
      <div className="wp-empty-card">
        <h3>Page encore en construction</h3>
        <p>Le squelette est en place pour la navigation, l'état vide et la future maquette. La prochaine étape sera de brancher les read models et l'UX détaillée.</p>
        <button className="wp-primary" type="button" onClick={onBackToDashboard}>{ctaLabel}</button>
      </div>
    </div>
  );
}

export function ImportView({ csvErrors, csvFileName, csvRows, errorMessage, isError, isPending, onBackToDashboard, onFileParsed, onResetFile, onSubmit, puzzleListIsLocked, selectedTraining }: { csvErrors: string[]; csvFileName: string; csvRows: PuzzleCsvRow[]; errorMessage?: string; isError: boolean; isPending: boolean; onBackToDashboard: () => void; onFileParsed: (fileName: string, rows: PuzzleCsvRow[], errors: string[]) => void; onResetFile: () => void; onSubmit: () => void; puzzleListIsLocked: boolean; selectedTraining: Training | null; }) {
  const previewRows = csvRows.slice(0, 5);
  const hasImportReadyRows = csvRows.length > 0 && csvErrors.length === 0;

  return (
    <div className="wp-page wp-import-page">
      <PageHeader
        action={!selectedTraining ? <button className="wp-secondary" type="button" onClick={onBackToDashboard}>Retour au tableau de bord</button> : undefined}
        eyebrow="Import CSV"
        title="Importer des puzzles"
        description={selectedTraining ? `Import cible : ${selectedTraining.name}` : 'Sélectionne d abord un entraînement depuis le tableau de bord.'}
      />

      <div className="wp-detail-overview-grid wp-import-top-grid">
        <section className="wp-panel wp-detail-highlight wp-import-highlight">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">Controle</p>
              <h3>{hasImportReadyRows ? 'Import pret' : 'Verification en cours'}</h3>
            </div>
          </div>
          <p className="wp-detail-highlight-copy">
            {hasImportReadyRows
              ? 'Le fichier semble coherent. Tu peux importer ce lot dans le training sélectionne.'
              : 'Charge un CSV puis corrige les erreurs detectees avant l import definitif.'}
          </p>
          <div className="wp-inline-metrics">
            <span>{csvRows.length} puzzle(s) detectes</span>
            <span>{csvErrors.length} erreur(s)</span>
            <span>{selectedTraining ? selectedTraining.name : 'Aucun training cible'}</span>
          </div>
        </section>

        <section className="wp-panel wp-detail-highlight subdued wp-import-format-card">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">Format attendu</p>
              <h3>Points verifies</h3>
            </div>
          </div>
          <div className="wp-inline-metrics wp-inline-metrics-spaced">
            <span>Moves ou solution obligatoire</span>
            <span>FEN valide si fournie</span>
            <span>Coups UCI legaux</span>
            <span>Doublons detectes</span>
          </div>
        </section>
      </div>

      {!selectedTraining && (
        <div className="wp-empty-card">
          <h3>Aucun training cible</h3>
          <p>Choisis d'abord un entraînement depuis le tableau de bord pour ouvrir l import CSV dans le bon contexte.</p>
          <button className="wp-primary" type="button" onClick={onBackToDashboard}>Choisir un entraînement</button>
        </div>
      )}

      <div className="wp-two-columns wp-import-main-grid">
        <section className="wp-panel wp-import-upload-card">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">1. Charger votre fichier CSV</p>
              <h3>CSV compatible Lichess</h3>
            </div>
          </div>

          <p className="muted">
            Colonnes attendues : <code>PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags</code>. Seule <code>Moves</code> est obligatoire.
          </p>

          <div className="wp-inline-metrics wp-inline-metrics-spaced">
            <span>Separateur virgule ou point-virgule</span>
            <span>Notation UCI uniquement</span>
            <span>Les lignes dupliquees sont refusees</span>
          </div>

          {puzzleListIsLocked && <p className="alert warning-alert">Import desactive : un cycle existe deja, donc la liste de puzzles est verrouillee.</p>}

          {csvFileName && (
            <div className="wp-import-file-pill">
              <strong>{csvFileName}</strong>
              <button className="wp-secondary" type="button" onClick={onResetFile}>Retirer</button>
            </div>
          )}

          <label className="wp-dropzone wp-dropzone-large">
            <span>Glisse-depose ton fichier CSV ici</span>
            <small>ou clique pour choisir un fichier. Coups en notation UCI uniquement.</small>
            <input
              accept=".csv,text/csv"
              disabled={!selectedTraining || puzzleListIsLocked}
              type="file"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  onResetFile();
                  return;
                }
                const result = parsePuzzleCsv(await file.text());
                onFileParsed(file.name, result.rows, result.errors);
              }}
            />
          </label>
        </section>

        <section className="wp-panel wp-import-summary-card">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">2. Resume de l import</p>
              <h3>Previsualisation</h3>
            </div>
          </div>

          <div className="wp-stats compact wp-import-stats">
            <Stat label="Puzzles detectes" value={String(csvRows.length)} />
            <Stat label="Erreurs detectees" value={String(csvErrors.length)} />
          </div>

          {csvErrors.length > 0 && (
            <div className="alert error-alert">
              <p>Erreurs de validation :</p>
              <ul>
                {csvErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}

          {csvErrors.length === 0 && csvRows.length > 0 && <p className="alert info-alert">Le fichier est valide et pret a etre importe.</p>}

          {previewRows.length > 0 && (
            <div className="wp-import-preview-list wp-import-preview-table">
              {previewRows.map((row, index) => (
                <article className="wp-import-preview-row" key={`${row.fen ?? 'initial'}-${row.solution.join('-')}-${index}`}>
                  <strong>Puzzle {index + 1}</strong>
                  <span>{row.solution.join(' ')}</span>
                  <small>{row.themes.length > 0 ? row.themes.join(', ') : 'Sans theme'}{' - '}{row.rating ? `Rating ${row.rating}` : 'Rating libre'}</small>
                </article>
              ))}
            </div>
          )}

          {isError && <p className="alert error-alert">{errorMessage}</p>}

          <button className="wp-primary full" disabled={!selectedTraining || puzzleListIsLocked || isPending || csvRows.length === 0 || csvErrors.length > 0} type="button" onClick={onSubmit}>
            {isPending ? 'Import...' : `Importer ${csvRows.length} puzzle(s)`}
          </button>
        </section>
      </div>
    </div>
  );
}








