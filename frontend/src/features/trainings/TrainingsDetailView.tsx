import type { CSSProperties } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import * as AppIcons from '../../shared/AppIcons';
import { PageHeader } from './TrainingsViewPrimitives';
import { formatDateTime } from './trainingsUtils';
import type {
  CycleStats,
  Training,
  TrainingAnalytics,
  TrainingAttemptSummary,
  TrainingCycleSummary,
  TrainingPuzzle,
  TrainingSummary,
} from './trainingsTypes';
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

type PuzzleRowTone = 'green' | 'amber' | 'blue' | 'red';

type PuzzleRowStatus = {
  attemptedAtLabel: string;
  attemptsLabel: string;
  percentageLabel: string;
  statusLabel: string;
  tone: PuzzleRowTone;
};

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

function getTrainingIcon(icon?: string | null) {
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

function formatCompactDate(value?: string | null) {
  if (!value) {
    return 'Jamais';
  }

  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDifficultyLabel(rating?: number | null) {
  if (!rating) {
    return 'Libre';
  }
  if (rating < 1400) {
    return 'Facile';
  }
  if (rating < 1900) {
    return 'Moyen';
  }
  return 'Difficile';
}

function getAttemptForPosition(attempts: TrainingAttemptSummary[], position: number) {
  return attempts.find((attempt) => attempt.trainingPuzzlePosition === position) ?? null;
}

function getPuzzleStatus(attempt: TrainingAttemptSummary | null): PuzzleRowStatus {
  if (!attempt) {
    return {
      attemptedAtLabel: 'Jamais',
      attemptsLabel: '0',
      percentageLabel: '0%',
      statusLabel: 'Non tenté',
      tone: 'blue',
    };
  }

  if (attempt.successful) {
    return {
      attemptedAtLabel: formatCompactDate(attempt.attemptedAt),
      attemptsLabel: '1',
      percentageLabel: '100%',
      statusLabel: 'Résolu',
      tone: 'green',
    };
  }

  return {
    attemptedAtLabel: formatCompactDate(attempt.attemptedAt),
    attemptsLabel: String(Math.max(attempt.mistakesCount, 1)),
    percentageLabel: attempt.mistakesCount > 2 ? '0%' : '50%',
    statusLabel: attempt.mistakesCount > 2 ? 'Échoué' : 'À revoir',
    tone: attempt.mistakesCount > 2 ? 'red' : 'amber',
  };
}

function getCycleDelta(cycleSummaries: TrainingCycleSummary[]) {
  if (cycleSummaries.length < 2) {
    return null;
  }

  return cycleSummaries[0].progressPercent - cycleSummaries[1].progressPercent;
}

function buildPercentLabel(value: number, total: number) {
  if (total <= 0) {
    return '0%';
  }
  return String(Math.round((value / total) * 100)) + '%';
}

function parseFenBoard(fen?: string | null) {
  const board = fen?.trim().split(' ')[0] ?? '';
  const rows = board.split('/');
  if (rows.length !== 8) {
    return null;
  }

  try {
    return rows.map((row) => {
      const cells: string[] = [];
      for (const token of row) {
        const emptyCount = Number(token);
        if (Number.isInteger(emptyCount) && emptyCount > 0) {
          for (let index = 0; index < emptyCount; index += 1) {
            cells.push('');
          }
        } else {
          cells.push(token);
        }
      }

      if (cells.length !== 8) {
        throw new Error('invalid fen row');
      }

      return cells;
    });
  } catch {
    return null;
  }
}

function ProgressRing({ percent }: { percent: number }) {
  const style = {
    '--detail-progress': String(percent) + '%',
  } as CSSProperties;

  return (
    <div className="wp-detail-cycle-ring" style={style}>
      <div>
        <strong>{String(percent) + '%'}</strong>
      </div>
    </div>
  );
}

function PuzzlePreview({ fen }: { fen?: string | null }) {
  const rows = parseFenBoard(fen);

  if (!rows) {
    return <span className="wp-detail-problem-preview__empty">?</span>;
  }

  return (
    <span className="wp-detail-problem-preview__board" aria-hidden="true">
      {rows.map((row, rowIndex) =>
        row.map((piece, columnIndex) => {
          const isDark = (rowIndex + columnIndex) % 2 === 1;
          const cellClassName = isDark
            ? 'wp-detail-problem-preview__cell is-dark'
            : 'wp-detail-problem-preview__cell is-light';
          return (
            <span className={cellClassName} key={String(rowIndex) + '-' + String(columnIndex)}>
              {piece ? PIECE_SYMBOLS[piece] ?? '' : ''}
            </span>
          );
        }),
      )}
    </span>
  );
}

function DetailView({
  analytics,
  analyticsError,
  analyticsIsError,
  analyticsIsLoading,
  cycleStats,
  hasResumableCycle,
  onBackToDashboard,
  onImport,
  onOpenSolver,
  onPuzzleSelect,
  onStartCycle,
  puzzleCount,
  puzzleListIsLocked,
  selectedTraining,
  startCycleError,
  startCycleIsError,
  startCycleIsPending,
  summary,
  summaryError,
  summaryIsError,
  summaryIsLoading,
  trainingPuzzles,
  trainingPuzzlesError,
  trainingPuzzlesIsError,
  trainingPuzzlesIsLoading,
}: DetailViewProps) {
  if (!selectedTraining) {
    return (
      <div className="wp-page">
        <PageHeader
          action={
            <button className="wp-secondary" type="button" onClick={onBackToDashboard}>
              Retour au tableau de bord
            </button>
          }
          eyebrow="Détail"
          title="Sélectionne un entraînement"
          description="Retourne au tableau de bord pour ouvrir un entraînement existant."
        />
      </div>
    );
  }

  const trainingIcon = getTrainingIcon(selectedTraining.icon);
  const cycleSummaries = summary?.cycleSummaries ?? [];
  const latestCycleSummary = summary?.latestCycleSummary ?? cycleSummaries[0] ?? null;
  const latestAttempts = summary?.latestAttempts ?? [];
  const summaryPuzzleCount = summary?.puzzleCount ?? puzzleCount;
  const attemptCount = summary?.attemptCount ?? 0;
  const averageMistakes = summary?.averageMistakes ?? 0;
  const hasStartedCycle = Boolean(latestCycleSummary || hasResumableCycle || cycleSummaries.length > 0);
  const cycleNumber = latestCycleSummary?.cycle.number ?? 1;
  const cycleDelta = getCycleDelta(cycleSummaries);
  const progressLabel = cycleDelta === null
    ? String(cycleStats.progressPercent) + '%'
    : (cycleDelta > 0 ? '+' : '') + String(cycleDelta) + '% ce cycle';
  const collectionLabel = puzzleListIsLocked ? 'Collection verrouillée' : 'Collection ouverte';
  const layoutClassName = hasStartedCycle ? 'wp-detail-layout-v2' : 'wp-detail-layout-v2 is-prestart';
  const cyclePlaceholders = Math.max(0, 3 - cycleSummaries.length);
  const attemptPlaceholders = Math.max(0, 4 - latestAttempts.length);

  return (
    <div className="wp-page wp-detail-page-v2">
      <header className="wp-detail-hero-v2">
        <div className="wp-detail-hero-v2__identity">
          <div className="wp-detail-hero-v2__badge">
            {trainingIcon}
          </div>
          <div className="wp-detail-hero-v2__copy">
            <h1>{selectedTraining.name}</h1>
            <p>{selectedTraining.description || 'Entraînement tactique personnalisé.'}</p>
          </div>
        </div>

        <div className="wp-detail-hero-v2__actions">
          {hasStartedCycle ? (
            <button className="wp-primary wp-detail-hero-v2__primary" type="button" onClick={onOpenSolver}>
              Ouvrir le solveur
            </button>
          ) : (
            <div className="wp-detail-hero-v2__action-row">
              <button className="wp-secondary wp-detail-hero-v2__secondary" type="button" onClick={onImport}>
                Ajouter des puzzles
              </button>
              <button
                className="wp-primary wp-detail-hero-v2__primary"
                disabled={startCycleIsPending || trainingPuzzles.length === 0}
                type="button"
                onClick={onStartCycle}
              >
                {startCycleIsPending ? 'Démarrage...' : 'Démarrer le cycle'}
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="wp-detail-kpis-v2">
        <article className="wp-detail-kpi-v2 tone-blue">
          <div className="wp-detail-kpi-v2__header">
            <span className="wp-detail-kpi-v2__icon"><AppIcons.BarsIcon /></span>
            <p>Problèmes</p>
          </div>
          <strong>{summaryPuzzleCount}</strong>
          <small>{hasStartedCycle ? 'Total' : 'Collection'}</small>
        </article>
        <article className="wp-detail-kpi-v2 tone-green">
          <div className="wp-detail-kpi-v2__header">
            <span className="wp-detail-kpi-v2__icon"><AppIcons.TrendUpIcon /></span>
            <p>{hasStartedCycle ? 'Progression' : 'Réussite du cycle actuel'}</p>
          </div>
          <strong>{String(cycleStats.progressPercent) + '%'}</strong>
          <small>{progressLabel}</small>
        </article>
        <article className="wp-detail-kpi-v2 tone-green">
          <div className="wp-detail-kpi-v2__header">
            <span className="wp-detail-kpi-v2__icon"><AppIcons.CheckCircleIcon /></span>
            <p>Résolus</p>
          </div>
          <strong>{cycleStats.solved}</strong>
          <small>{buildPercentLabel(cycleStats.solved, summaryPuzzleCount)}</small>
        </article>
        <article className="wp-detail-kpi-v2 tone-amber">
          <div className="wp-detail-kpi-v2__header">
            <span className="wp-detail-kpi-v2__icon"><AppIcons.RepeatIcon /></span>
            <p>À revoir</p>
          </div>
          <strong>{cycleStats.failed}</strong>
          <small>{buildPercentLabel(cycleStats.failed, summaryPuzzleCount)}</small>
        </article>
        <article className="wp-detail-kpi-v2 tone-blue">
          <div className="wp-detail-kpi-v2__header">
            <span className="wp-detail-kpi-v2__icon"><AppIcons.HistoryIcon /></span>
            <p>Restants</p>
          </div>
          <strong>{cycleStats.pending}</strong>
          <small>{buildPercentLabel(cycleStats.pending, summaryPuzzleCount)}</small>
        </article>
        <article className="wp-detail-kpi-v2 tone-violet">
          <div className="wp-detail-kpi-v2__header">
            <span className="wp-detail-kpi-v2__icon"><AppIcons.TargetIcon /></span>
            <p>Tentatives</p>
          </div>
          <strong>{attemptCount}</strong>
          <small>{averageMistakes.toFixed(1) + ' moy.'}</small>
        </article>
      </section>

      <div className={layoutClassName}>
        <div className="wp-detail-layout-v2__main">
          {hasStartedCycle ? (
            <section className="wp-panel wp-detail-status-card-v2">
              <div className="wp-panel-title">
                <div>
                  <h3>Statut du cycle</h3>
                </div>
              </div>

              <div className="wp-detail-status-card-v2__grid wp-detail-status-card-v2__grid--compact">
                <div className="wp-detail-status-card-v2__progress">
                  <ProgressRing percent={cycleStats.progressPercent} />
                  <div>
                    <strong>{'Cycle ' + cycleNumber}</strong>
                    <small>
                      {latestCycleSummary?.cycle.startedAt
                        ? formatCompactDate(latestCycleSummary.cycle.startedAt) + (latestCycleSummary?.cycle.completedAt ? ' - ' + formatCompactDate(latestCycleSummary.cycle.completedAt) : '')
                        : 'Date indisponible'}
                    </small>
                  </div>
                </div>

                <div className="wp-detail-status-card-v2__lock">
                  <span className="wp-detail-status-card-v2__lock-icon"><AppIcons.LockIcon /></span>
                  <div>
                    <strong>{collectionLabel}</strong>
                    <p>{puzzleListIsLocked ? 'Terminez le cycle actuel pour débloquer de nouveaux problèmes.' : 'La collection reste accessible sur ce cycle.'}</p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="wp-panel wp-detail-tolerance-card-v2">
              <div className="wp-panel-title">
                <div>
                  <h3>Tolérance des erreurs</h3>
                </div>
              </div>

              <div className="wp-detail-tolerance-card-v2__options">
                {[3, 2, 1].map((value) => {
                  const isActive = selectedTraining.mistakeLimit === value;
                  const subtitle = value === 3 ? 'Tolérant' : value === 2 ? 'Standard' : 'Strict';
                  return (
                    <article className={isActive ? 'wp-detail-tolerance-option is-active' : 'wp-detail-tolerance-option'} key={value}>
                      <span className="wp-detail-tolerance-option__icon">{isActive ? <AppIcons.CheckCircleIcon /> : <span className="wp-detail-tolerance-option__dot" />}</span>
                      <strong>{String(value) + ' ' + (value > 1 ? 'erreurs' : 'erreur')}</strong>
                      <small>{subtitle}</small>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="wp-panel wp-detail-collection-card-v2">
            <div className="wp-panel-title with-action">
              <div>
                <h3>Collection de problèmes</h3>
                <p>{summaryPuzzleCount} problèmes</p>
              </div>
            </div>

            {trainingPuzzlesIsLoading ? <p className="wp-empty">Chargement des problèmes...</p> : null}
            {trainingPuzzlesIsError ? <p className="alert error-alert">{trainingPuzzlesError}</p> : null}
            {startCycleIsError ? <p className="alert error-alert">{startCycleError}</p> : null}
            {analyticsIsLoading ? <p className="wp-empty">Chargement des analytics...</p> : null}
            {analyticsIsError ? <p className="alert error-alert">{analyticsError}</p> : null}
            {summaryIsError ? <p className="alert error-alert">{summaryError}</p> : null}
            {!trainingPuzzlesIsLoading && trainingPuzzles.length === 0 ? <p className="wp-empty">Aucun problème ajouté pour le moment.</p> : null}

            {trainingPuzzles.length > 0 ? (
              <div className="wp-detail-problems-table-wrap">
                <table className="wp-detail-problems-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Aperçu</th>
                      <th>Difficulté</th>
                      <th>Statut</th>
                      <th>Réussite</th>
                      <th>Tentatives</th>
                      <th>Dernière tentative</th>
                      <th aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {trainingPuzzles.slice(0, 5).map((trainingPuzzle) => {
                      const puzzle = typeof trainingPuzzle.puzzle === 'string' ? null : trainingPuzzle.puzzle;
                      const attempt = getAttemptForPosition(latestAttempts, trainingPuzzle.position);
                      const status = getPuzzleStatus(attempt);
                      return (
                        <tr key={trainingPuzzle['@id']}>
                          <td>{trainingPuzzle.position + 1}</td>
                          <td>
                            <button className="wp-detail-problem-preview" type="button" onClick={() => onPuzzleSelect(trainingPuzzle['@id'])}>
                              <PuzzlePreview fen={puzzle?.fen} />
                            </button>
                          </td>
                          <td className={'tone-' + status.tone}>{getDifficultyLabel(puzzle?.rating)}</td>
                          <td>
                            <span className={'wp-detail-table-status tone-' + status.tone}>{status.statusLabel}</span>
                          </td>
                          <td>{status.percentageLabel}</td>
                          <td>{status.attemptsLabel}</td>
                          <td>{status.attemptedAtLabel}</td>
                          <td>
                            <button className="wp-detail-table-arrow" type="button" onClick={() => onPuzzleSelect(trainingPuzzle['@id'])}>
                              ›
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {trainingPuzzles.length > 5 ? (
              <button className="wp-detail-collection-card-v2__more" type="button" onClick={() => onPuzzleSelect(trainingPuzzles[0]['@id'])}>
                Voir tous les problèmes ›
              </button>
            ) : null}
          </section>
        </div>

        {hasStartedCycle ? (
          <div className="wp-detail-layout-v2__side">
            <section className="wp-panel wp-detail-side-card-v2">
              <div className="wp-panel-title with-action">
                <div>
                  <h3>Historique des cycles</h3>
                </div>
                {cycleSummaries.length > 0 ? <button className="wp-link-button" type="button">Voir tout</button> : null}
              </div>

              {summaryIsLoading ? <p className="wp-empty">Chargement des cycles...</p> : null}
              {!summaryIsLoading && !summaryIsError && cycleSummaries.length === 0 ? <p className="wp-empty">Aucun cycle lancé pour le moment.</p> : null}

              {cycleSummaries.length > 0 ? (
                <div className="wp-detail-side-list">
                  {cycleSummaries.slice(0, 5).map((item) => (
                    <article className="wp-detail-side-row" key={item.cycle['@id']}>
                      <div className="wp-detail-side-row__copy">
                        <strong>{'Cycle ' + item.cycle.number}</strong>
                        <small>{item.cycle.startedAt ? formatCompactDate(item.cycle.startedAt) : 'Non démarré'}{item.cycle.completedAt ? ' - ' + formatCompactDate(item.cycle.completedAt) : ''}</small>
                      </div>
                      <span className="tone-green">{String(item.progressPercent) + '%'}</span>
                      <span className={item.progressPercent >= 50 ? 'tone-green' : item.progressPercent >= 1 ? 'tone-amber' : 'tone-blue'}>
                        {item.progressPercent > 0 ? '+' + String(Math.max(item.progressPercent - 50, 0)) + '%' : '—'}
                      </span>
                      <button className="wp-detail-table-arrow" type="button">›</button>
                    </article>
                  ))}
                  {Array.from({ length: cyclePlaceholders }).map((_, index) => (
                    <article className="wp-detail-side-row wp-detail-side-row--placeholder" key={'cycle-placeholder-' + String(index)}>
                      <div className="wp-detail-side-row__copy">
                        <strong>Cycle suivant</strong>
                        <small>Il apparaîtra ici dès qu un nouveau cycle sera lancé.</small>
                      </div>
                      <span>—</span>
                      <span>—</span>
                      <span className="wp-detail-table-arrow">·</span>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="wp-panel wp-detail-side-card-v2">
              <div className="wp-panel-title with-action">
                <div>
                  <h3>Dernières tentatives</h3>
                </div>
                {latestAttempts.length > 0 ? <button className="wp-link-button" type="button">Voir tout</button> : null}
              </div>

              {summaryIsLoading ? <p className="wp-empty">Chargement des tentatives...</p> : null}
              {!summaryIsLoading && !summaryIsError && latestAttempts.length === 0 ? <p className="wp-empty">Aucune tentative sauvegardée pour le moment.</p> : null}

              {latestAttempts.length > 0 ? (
                <div className="wp-detail-side-list">
                  {latestAttempts.slice(0, 5).map((attempt) => {
                    const tone: PuzzleRowTone = attempt.successful ? 'green' : attempt.mistakesCount > 2 ? 'red' : 'amber';
                    return (
                      <article className="wp-detail-side-row wp-detail-side-row--attempt" key={attempt['@id']}>
                        <div className={'wp-detail-side-row__status tone-' + tone}>
                          {attempt.successful ? <AppIcons.CheckCircleIcon /> : <AppIcons.RepeatIcon />}
                        </div>
                        <div className="wp-detail-side-row__copy">
                          <strong>{attempt.successful ? 'Réussi' : attempt.mistakesCount > 2 ? 'Échoué' : 'Partiellement réussi'}</strong>
                          <small>{String(Math.max(attempt.mistakesCount, 1)) + ' tentative' + (Math.max(attempt.mistakesCount, 1) > 1 ? 's' : '')}</small>
                        </div>
                        <span>{formatDateTime(attempt.attemptedAt)}</span>
                        <button className="wp-detail-table-arrow" type="button">›</button>
                      </article>
                    );
                  })}
                  {Array.from({ length: attemptPlaceholders }).map((_, index) => (
                    <article className="wp-detail-side-row wp-detail-side-row--attempt wp-detail-side-row--placeholder" key={'attempt-placeholder-' + String(index)}>
                      <div className="wp-detail-side-row__status">·</div>
                      <div className="wp-detail-side-row__copy">
                        <strong>Prochaine tentative</strong>
                        <small>Cette zone se remplit au fur et à mesure de vos essais.</small>
                      </div>
                      <span>—</span>
                      <span className="wp-detail-table-arrow">·</span>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { DetailView };
export default DetailView;
