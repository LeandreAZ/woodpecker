import type {
  CycleStats,
  Training,
  TrainingAnalytics,
  TrainingAttemptSummary,
  TrainingCycleSummary,
  TrainingPuzzle,
  TrainingSummary,
} from './trainingsTypes';
import type { UseMutationResult } from '@tanstack/react-query';
import { PageHeader } from './TrainingsViewPrimitives';
import { formatDateTime, formatDuration, getCycleStatusLabel } from './trainingsUtils';
import './detail.css';

type DetailViewProps = {
  analytics: TrainingAnalytics | null;
  analyticsError?: string;
  analyticsIsError: boolean;
  analyticsIsLoading: boolean;
  createPuzzleMutation: UseMutationResult<TrainingPuzzle, Error, void, unknown>;
  cycleStats: CycleStats;
  cycleStatusLabel: string;
  deletePuzzleError?: string;
  deletePuzzleIsError: boolean;
  deletePuzzleIsPending: boolean;
  fen: string;
  hasResumableCycle: boolean;
  movePuzzleError?: string;
  movePuzzleIsError: boolean;
  movePuzzleIsPending: boolean;
  onBackToDashboard: () => void;
  onFenChange: (value: string) => void;
  onImport: () => void;
  onOpenSolver: () => void;
  onPersonalNoteChange: (value: string) => void;
  onPuzzleDelete: (trainingPuzzleIri: string) => void;
  onPuzzleMove: (trainingPuzzleIri: string, direction: 'down' | 'up') => void;
  onPuzzleSelect: (trainingPuzzleIri: string) => void;
  onRatingChange: (value: string) => void;
  onSolutionTextChange: (value: string) => void;
  onStartCycle: () => void;
  onThemesTextChange: (value: string) => void;
  personalNote: string;
  puzzleCount: number;
  puzzleListIsLocked: boolean;
  rating: string;
  selectedTraining: Training | null;
  solutionText: string;
  startCycleError?: string;
  startCycleIsError: boolean;
  startCycleIsPending: boolean;
  summary: TrainingSummary | null;
  summaryError?: string;
  summaryIsError: boolean;
  summaryIsLoading: boolean;
  themesText: string;
  trainingPuzzles: TrainingPuzzle[];
  trainingPuzzlesError?: string;
  trainingPuzzlesIsError: boolean;
  trainingPuzzlesIsLoading: boolean;
};

function DetailView(props: DetailViewProps) {
  const {
    analytics,
    analyticsError,
    analyticsIsError,
    analyticsIsLoading,
    createPuzzleMutation,
    cycleStats,
    cycleStatusLabel,
    deletePuzzleError,
    deletePuzzleIsError,
    deletePuzzleIsPending,
    fen,
    hasResumableCycle,
    movePuzzleError,
    movePuzzleIsError,
    movePuzzleIsPending,
    onBackToDashboard,
    onFenChange,
    onImport,
    onOpenSolver,
    onPersonalNoteChange,
    onPuzzleDelete,
    onPuzzleMove,
    onPuzzleSelect,
    onRatingChange,
    onSolutionTextChange,
    onStartCycle,
    onThemesTextChange,
    personalNote,
    puzzleCount,
    puzzleListIsLocked,
    rating,
    selectedTraining,
    solutionText,
    startCycleError,
    startCycleIsError,
    startCycleIsPending,
    summary,
    summaryError,
    summaryIsError,
    summaryIsLoading,
    themesText,
    trainingPuzzles,
    trainingPuzzlesError,
    trainingPuzzlesIsError,
    trainingPuzzlesIsLoading,
  } = props;

  if (!selectedTraining) {
    return (
      <div className="wp-page">
        <PageHeader
          action={
            <button className="wp-secondary" type="button" onClick={onBackToDashboard}>
              Retour au tableau de bord
            </button>
          }
          eyebrow="Detail"
          title="Selectionne un entrainement"
          description="Retourne au tableau de bord pour ouvrir un entrainement existant."
        />
      </div>
    );
  }

  const latestCycleSummary = summary?.latestCycleSummary ?? null;
  const latestAttempts = summary?.latestAttempts ?? [];
  const cycleSummaries = summary?.cycleSummaries ?? [];
  const summaryPuzzleCount = summary?.puzzleCount ?? puzzleCount;
  const ratedPuzzleCount = summary?.ratedPuzzleCount ?? 0;
  const notedPuzzleCount = summary?.notedPuzzleCount ?? 0;
  const themedPuzzleCount = summary?.themedPuzzleCount ?? 0;
  const solvedAttempts = summary?.solvedAttemptCount ?? 0;
  const averageMistakes = summary ? summary.averageMistakes.toFixed(1) : '0.0';
  const attemptCount = summary?.attemptCount ?? 0;
  const analyticsPerformance = analytics?.performance ?? null;
  const analyticsProgression = analytics?.progressionSnapshot ?? null;
  const analyticsCycleTimeline = analytics?.cycleTimeline ?? [];
  const latestCycleDate = latestCycleSummary?.cycle.startedAt ? formatDateTime(latestCycleSummary.cycle.startedAt) : null;
  const cycleHeadline = latestCycleSummary ? `Cycle ${latestCycleSummary.cycle.number}` : hasResumableCycle ? 'Cycle en pause' : 'Collection prete';
  const cycleCopy = latestCycleSummary
    ? `Tu as ${latestCycleSummary.solved} resolu(s), ${latestCycleSummary.failed} a revoir et ${latestCycleSummary.pending} restant(s).`
    : 'Prepare la collection puis demarre un cycle pour reproduire la cadence Woodpecker.';

  return (
    <div className="wp-page wp-detail-page">
      <PageHeader
        eyebrow="Detail entrainement"
        title={selectedTraining.name}
        description={selectedTraining.description || 'Entraine ce set, verrouille-le dans un cycle, puis travaille tes repetitions.'}
        action={
          <button className="wp-primary" type="button" onClick={onOpenSolver}>
            Ouvrir le solveur
          </button>
        }
      />

      <section className="wp-detail-hero-shell wp-panel">
        <div className="wp-detail-title-block">
          <div className="wp-detail-art">#</div>
          <div className="wp-detail-title-copy">
            <p className="eyebrow">Training tactique</p>
            <h3>{selectedTraining.name}</h3>
            <p>{selectedTraining.description || 'Collection dediee aux repetitions tactiques progressives.'}</p>
            <div className="wp-inline-metrics">
              <span>{summaryPuzzleCount} problemes</span>
              <span>{selectedTraining.createdAt ? `Cree le ${formatDateTime(selectedTraining.createdAt)}` : 'Date de creation indisponible'}</span>
              <span>{hasResumableCycle ? 'Tactique' : 'Collection prete'}</span>
            </div>
          </div>
        </div>

        <div className="wp-detail-hero-actions">
          <button className="wp-primary" disabled={startCycleIsPending || trainingPuzzles.length === 0} type="button" onClick={onStartCycle}>
            {startCycleIsPending ? (hasResumableCycle ? 'Reprise...' : 'Demarrage...') : hasResumableCycle ? 'Reprendre le cycle' : 'Demarrer un cycle'}
          </button>
          <button className="wp-secondary" type="button" onClick={onImport}>
            Importer CSV
          </button>
          <button className="wp-secondary wp-icon-action" type="button" onClick={onBackToDashboard}>
            ...
          </button>
        </div>
      </section>

      <section className="wp-detail-kpis">
        <article className="wp-detail-kpi wp-panel">
          <span>Problemes</span>
          <strong>{summaryPuzzleCount}</strong>
          <small>dans la collection</small>
        </article>
        <article className="wp-detail-kpi wp-panel accent">
          <span>Progression</span>
          <strong>{cycleStats.progressPercent}%</strong>
          <small>{cycleStats.solved} / {summaryPuzzleCount || 0} resolus</small>
        </article>
        <article className="wp-detail-kpi wp-panel success">
          <span>Resolus</span>
          <strong>{cycleStats.solved}</strong>
          <small>{solvedAttempts} tentatives reussies</small>
        </article>
        <article className="wp-detail-kpi wp-panel warning">
          <span>A revoir</span>
          <strong>{cycleStats.failed}</strong>
          <small>{averageMistakes} erreur(s) / tentative</small>
        </article>
        <article className="wp-detail-kpi wp-panel muted">
          <span>Restants</span>
          <strong>{cycleStats.pending}</strong>
          <small>{attemptCount} tentatives enregistrees</small>
        </article>
        <article className="wp-detail-kpi wp-panel cycle">
          <span>Statut du cycle</span>
          <strong>{cycleStatusLabel}</strong>
          <small>{hasResumableCycle ? 'Cycle reprenable' : 'Pret a demarrer'}</small>
        </article>
      </section>

      <div className="wp-detail-overview-grid wp-detail-overview-grid-hero">
        <section className="wp-panel wp-detail-cycle-card">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">Cycle actuel</p>
              <h3>{cycleHeadline}</h3>
            </div>
            <span className="wp-status-pill success">{hasResumableCycle ? 'Reprenable' : 'Resume'}</span>
          </div>
          <p className="wp-detail-highlight-copy">{cycleCopy}</p>
          <div className="wp-detail-cycle-metrics">
            <div>
              <span>Resolus</span>
              <strong>{cycleStats.solved}</strong>
            </div>
            <div>
              <span>A revoir</span>
              <strong>{cycleStats.failed}</strong>
            </div>
            <div>
              <span>Restants</span>
              <strong>{cycleStats.pending}</strong>
            </div>
          </div>
          <div className="wp-inline-metrics wp-inline-metrics-spaced">
            <span>{hasResumableCycle ? 'Tu peux reprendre exactement la ou tu t es arrete.' : 'Le prochain cycle verrouillera la collection.'}</span>
            <span>{latestCycleDate ? `Derniere activite ${latestCycleDate}` : 'Aucune tentative recente'}</span>
          </div>
        </section>

        <section className="wp-panel wp-detail-lock-card">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">Collection verrouillee</p>
              <h3>{puzzleListIsLocked ? 'Edition suspendue' : 'Edition encore ouverte'}</h3>
            </div>
            <span className={`wp-status-pill ${puzzleListIsLocked ? 'warning' : 'info'}`}>{puzzleListIsLocked ? 'Verrouillee' : 'Editable'}</span>
          </div>
          <p className="wp-detail-highlight-copy">
            {puzzleListIsLocked
              ? 'La liste des problemes est verrouillee car un cycle existe deja. Termine ou supprime le cycle pour retrouver une edition complete.'
              : 'Tu peux encore enrichir, reordonner et nettoyer la collection avant de lancer un vrai cycle.'}
          </p>
          <div className="wp-inline-metrics wp-inline-metrics-spaced">
            <span>{ratedPuzzleCount} avec rating</span>
            <span>{themedPuzzleCount} avec themes</span>
            <span>{notedPuzzleCount} avec note perso</span>
          </div>
        </section>
      </div>

      <section className="wp-panel wp-history-panel">
        <div className="wp-panel-title">
          <div>
            <p className="eyebrow">Analytics</p>
            <h3>Progression du training</h3>
          </div>
        </div>

        {analyticsIsLoading && <p className="wp-empty">Chargement des analytics...</p>}
        {analyticsIsError && <p className="alert error-alert">{analyticsError}</p>}

        {analytics && (
          <>
            <div className="wp-inline-metrics wp-inline-metrics-spaced">
              <span>{analyticsPerformance?.successRate ?? 0}% de reussite</span>
              <span>{analyticsPerformance?.averageDurationSeconds ?? 0}s par tentative</span>
              <span>{analyticsProgression?.bestCycleProgressPercent ?? 0}% meilleur cycle</span>
              <span>{analyticsProgression?.resumableCycle ? 'Cycle encore reprenable' : 'Aucune reprise en attente'}</span>
            </div>

            <div className="wp-detail-overview-grid">
              <section className="wp-panel wp-detail-subpanel">
                <div className="wp-panel-title">
                  <div>
                    <p className="eyebrow">Performance</p>
                    <h3>Rythme de resolution</h3>
                  </div>
                </div>
                <div className="wp-import-preview-list">
                  <article className="wp-import-preview-row">
                    <strong>{analyticsPerformance?.attemptCount ?? 0} tentative(s)</strong>
                    <small>{analyticsPerformance?.solvedAttemptCount ?? 0} reussie(s), {analyticsPerformance?.failedAttemptCount ?? 0} a revoir.</small>
                  </article>
                  <article className="wp-import-preview-row">
                    <strong>{analyticsPerformance?.averageMistakes.toFixed(1) ?? '0.0'} erreur(s) / tentative</strong>
                    <small>{analyticsPerformance?.latestAttemptedAt ? `Derniere activite ${formatDateTime(analyticsPerformance.latestAttemptedAt)}.` : 'Aucune tentative enregistree pour le moment.'}</small>
                  </article>
                </div>
              </section>

              <section className="wp-panel wp-detail-subpanel">
                <div className="wp-panel-title">
                  <div>
                    <p className="eyebrow">Collection</p>
                    <h3>Preparation du set</h3>
                  </div>
                </div>
                <div className="wp-import-preview-list">
                  <article className="wp-import-preview-row">
                    <strong>{analytics.puzzleReadiness.puzzleCount} puzzle(s)</strong>
                    <small>{analytics.puzzleReadiness.ratedPuzzleCount} notes, {analytics.puzzleReadiness.themedPuzzleCount} avec themes, {analytics.puzzleReadiness.notedPuzzleCount} avec note perso.</small>
                  </article>
                  <article className="wp-import-preview-row">
                    <strong>{analyticsProgression?.latestCycleProgressPercent ?? 0}% sur le cycle courant</strong>
                    <small>{analyticsProgression?.completedCycleCount ?? 0} cycle(s) termines, {analyticsProgression?.activeCycleCount ?? 0} actif(s).</small>
                  </article>
                </div>
              </section>
            </div>

            {analyticsCycleTimeline.length > 0 && (
              <div className="wp-cycle-list">
                {analyticsCycleTimeline.map((item) => (
                  <article className="wp-cycle-row" key={item.cycle['@id']}>
                    <div>
                      <strong>Cycle {item.cycle.number}</strong>
                      <span>{getCycleStatusLabel(item.cycle.status)}</span>
                    </div>
                    <div className="wp-cycle-row-progress">
                      <div className="wp-progress">
                        <span style={{ width: `${item.progressPercent}%` }} />
                      </div>
                      <small>{item.solved} resolu(s), {item.failed} a revoir, {item.pending} restant(s)</small>
                    </div>
                    <div className="wp-cycle-row-meta">
                      <span>{item.attemptCount} tentative(s)</span>
                      <span>{item.cycle.startedAt ? `Debut ${formatDateTime(item.cycle.startedAt)}` : 'Pas demarre'}</span>
                      {item.cycle.completedAt && <span>Fin {formatDateTime(item.cycle.completedAt)}</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <div className="wp-two-columns wp-detail-main-columns">
        <section className="wp-panel wp-detail-form-panel">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">Ajouter manuellement un probleme</p>
              <h3>Enrichir la collection</h3>
            </div>
          </div>

          {puzzleListIsLocked && <p className="alert warning-alert">La collection est verrouillee pendant un cycle en cours. Les nouveaux problemes seront ajoutes apres la fin du cycle.</p>}

          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              if (!puzzleListIsLocked) {
                createPuzzleMutation.mutate();
              }
            }}
          >
            <label>
              FEN ou position
              <textarea disabled={puzzleListIsLocked} onChange={(event) => onFenChange(event.target.value)} placeholder="Colle une FEN ou utilise l editeur de position" rows={2} value={fen} />
            </label>

            <label>
              Solution (variation principale)
              <input disabled={puzzleListIsLocked} onChange={(event) => onSolutionTextChange(event.target.value)} placeholder="Ex : e2e4 e7e5 g1f3" required value={solutionText} />
            </label>

            <div className="form-grid">
              <label>
                Theme (optionnel)
                <input disabled={puzzleListIsLocked} onChange={(event) => onThemesTextChange(event.target.value)} placeholder="fork, pin, mate" value={themesText} />
              </label>
              <label>
                Rating
                <input disabled={puzzleListIsLocked} min={1} onChange={(event) => onRatingChange(event.target.value)} placeholder="1500" type="number" value={rating} />
              </label>
            </div>

            <label>
              Note personnelle
              <textarea disabled={puzzleListIsLocked} onChange={(event) => onPersonalNoteChange(event.target.value)} placeholder="Pourquoi ce probleme est interessant ?" rows={3} value={personalNote} />
            </label>

            {createPuzzleMutation.isError && <p className="alert error-alert">{createPuzzleMutation.error.message}</p>}

            <button className="wp-primary" disabled={createPuzzleMutation.isPending || puzzleListIsLocked} type="submit">
              {createPuzzleMutation.isPending ? 'Ajout...' : 'Ajouter a la collection'}
            </button>
          </form>
        </section>

        <section className="wp-panel wp-detail-collection wp-detail-collection-panel">
          <div className="wp-panel-title with-action">
            <div>
              <p className="eyebrow">Collection de problemes</p>
              <h3>Liste active</h3>
            </div>
            <button className="wp-secondary" type="button" onClick={onImport}>
              Importer CSV
            </button>
          </div>

          <div className="wp-inline-metrics wp-inline-metrics-spaced">
            <span>Total {summaryPuzzleCount}</span>
            <span>{themedPuzzleCount} avec themes</span>
            <span>{puzzleListIsLocked ? 'Collection verrouillee' : 'Collection editable'}</span>
          </div>

          <div className="wp-cycle-actions wp-cycle-actions-emphasis">
            <button className="wp-primary full" disabled={startCycleIsPending || trainingPuzzles.length === 0} type="button" onClick={onStartCycle}>
              {startCycleIsPending ? (hasResumableCycle ? 'Reprise...' : 'Demarrage...') : hasResumableCycle ? 'Reprendre le cycle' : 'Demarrer le cycle'}
            </button>
            <p>{hasResumableCycle ? 'Rouvre le cycle actif existant et continue sans creer de doublon.' : 'Cree un cycle actif, prepare les puzzles du cycle, puis ouvre le solveur.'}</p>
          </div>

          {startCycleIsError && <p className="alert error-alert">{startCycleError}</p>}
          {trainingPuzzlesIsLoading && <p className="wp-empty">Chargement des puzzles...</p>}
          {trainingPuzzlesIsError && <p className="alert error-alert">{trainingPuzzlesError}</p>}
          {deletePuzzleIsError && <p className="alert error-alert">{deletePuzzleError}</p>}
          {movePuzzleIsError && <p className="alert error-alert">{movePuzzleError}</p>}
          {!trainingPuzzlesIsLoading && trainingPuzzles.length === 0 && <p className="wp-empty">Aucun puzzle ajoute pour l instant.</p>}

          <div className="wp-puzzle-table wp-puzzle-table-rich">
            {trainingPuzzles.map((trainingPuzzle, index) => {
              const puzzle = typeof trainingPuzzle.puzzle === 'string' ? null : trainingPuzzle.puzzle;

              return (
                <div className="wp-puzzle-row-with-actions" key={trainingPuzzle['@id']}>
                  <button className="wp-puzzle-row" type="button" onClick={() => onPuzzleSelect(trainingPuzzle['@id'])}>
                    <span>#{trainingPuzzle.position + 1}</span>
                    <strong>{puzzle?.solution.join(' ') ?? 'Puzzle a charger'}</strong>
                    <em>{puzzle?.themes.join(', ') || trainingPuzzle.personalNote || 'Sans theme'}</em>
                    <small>{puzzle?.rating ? `Rating ${puzzle.rating}` : 'Rating libre'}{' - '}{trainingPuzzle.personalNote?.trim().length ? 'Note perso' : 'Sans note'}</small>
                  </button>

                  {!puzzleListIsLocked && (
                    <div className="wp-puzzle-actions">
                      <button aria-label={`Monter le puzzle ${trainingPuzzle.position + 1}`} className="wp-secondary wp-puzzle-action" disabled={movePuzzleIsPending || index === 0} type="button" onClick={() => onPuzzleMove(trainingPuzzle['@id'], 'up')}>
                        Haut
                      </button>
                      <button aria-label={`Descendre le puzzle ${trainingPuzzle.position + 1}`} className="wp-secondary wp-puzzle-action" disabled={movePuzzleIsPending || index === trainingPuzzles.length - 1} type="button" onClick={() => onPuzzleMove(trainingPuzzle['@id'], 'down')}>
                        Bas
                      </button>
                      <button
                        aria-label={`Supprimer le puzzle ${trainingPuzzle.position + 1}`}
                        className="wp-danger wp-puzzle-action"
                        disabled={deletePuzzleIsPending}
                        type="button"
                        onClick={() => {
                          const shouldDelete = window.confirm(`Supprimer le puzzle ${trainingPuzzle.position + 1} de ce training ?`);
                          if (shouldDelete) {
                            onPuzzleDelete(trainingPuzzle['@id']);
                          }
                        }}
                      >
                        Retirer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="wp-two-columns wp-detail-history-columns">
        <section className="wp-panel wp-history-panel">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">Cycles</p>
              <h3>Historique des cycles</h3>
            </div>
          </div>

          {summaryIsLoading && <p className="wp-empty">Chargement du resume...</p>}
          {summaryIsError && <p className="alert error-alert">{summaryError}</p>}
          {!summaryIsLoading && !summaryIsError && cycleSummaries.length === 0 && <p className="wp-empty">Aucun cycle lance pour l instant. Demarre un cycle quand la collection est prete.</p>}

          {cycleSummaries.length > 0 && (
            <div className="wp-cycle-list">
              {cycleSummaries.map((summaryItem: TrainingCycleSummary) => (
                <article className="wp-cycle-row" key={summaryItem.cycle['@id']}>
                  <div>
                    <strong>Cycle {summaryItem.cycle.number}</strong>
                    <span>{getCycleStatusLabel(summaryItem.cycle.status)}</span>
                  </div>
                  <div className="wp-cycle-row-progress">
                    <div className="wp-progress">
                      <span style={{ width: `${summaryItem.progressPercent}%` }} />
                    </div>
                    <small>{summaryItem.solved} resolu(s), {summaryItem.failed} a revoir, {summaryItem.pending} restant(s)</small>
                  </div>
                  <div className="wp-cycle-row-meta">
                    <span>{summaryItem.attemptCount} tentative(s)</span>
                    <span>{summaryItem.cycle.startedAt ? `Debut ${formatDateTime(summaryItem.cycle.startedAt)}` : 'Pas demarre'}</span>
                    {summaryItem.cycle.completedAt && <span>Fin {formatDateTime(summaryItem.cycle.completedAt)}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="wp-panel wp-history-panel">
          <div className="wp-panel-title">
            <div>
              <p className="eyebrow">Historique</p>
              <h3>Dernieres tentatives</h3>
            </div>
          </div>

          {summaryIsLoading && <p className="wp-empty">Chargement des tentatives...</p>}
          {summaryIsError && <p className="alert error-alert">{summaryError}</p>}
          {!summaryIsLoading && !summaryIsError && latestAttempts.length === 0 && <p className="wp-empty">Aucune tentative sauvegardee pour l instant. Demarre un cycle puis resous un puzzle.</p>}

          {latestAttempts.length > 0 && (
            <div className="wp-attempt-list">
              {latestAttempts.map((attempt: TrainingAttemptSummary) => (
                <article className="wp-attempt-row" key={attempt['@id']}>
                  <div>
                    <strong>{attempt.successful ? 'Reussi' : 'A revoir'}</strong>
                    <span>{attempt.cycleNumber ? `Cycle ${attempt.cycleNumber}` : 'Cycle'}{' - '}{typeof attempt.trainingPuzzlePosition === 'number' ? `Puzzle ${attempt.trainingPuzzlePosition + 1}` : 'Puzzle'}</span>
                  </div>
                  <div className="wp-attempt-metrics">
                    <span>{attempt.mistakesCount} erreur(s)</span>
                    <span>{formatDuration(attempt.durationMilliseconds)}</span>
                    <span>{formatDateTime(attempt.attemptedAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export { DetailView };
export default DetailView;
