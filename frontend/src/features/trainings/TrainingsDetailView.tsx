import { useState, type CSSProperties, type ReactNode } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Clock3,  FileUp,
  Info,
  List,
  Lock,
  Pencil,
  Play,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from './TrainingsViewPrimitives';
import { TrainingLogoBadge } from './TrainingBranding';
import { formatDateTime, getCycleStatusLabel } from './trainingsUtils';
import type {
  Cycle,
  CyclePuzzle,
  CycleStats,
  Training,
  TrainingAnalytics,
  TrainingAttemptSummary,
  TrainingCycleSummary,
  TrainingPuzzle,
  TrainingSummary,
} from './trainingsTypes';

type DetailViewProps = {
  analytics: TrainingAnalytics | null;
  analyticsError?: string;
  analyticsIsError: boolean;
  analyticsIsLoading: boolean;
  createPuzzleMutation: UseMutationResult<TrainingPuzzle, Error, void, unknown>;
  currentCycle: Cycle | null;
  cyclePuzzles: CyclePuzzle[];
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
  onEditTraining: () => void;
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


type DetailStat = {
  icon: LucideIcon;
  label: string;
  meta: string;
  tone: 'success' | 'primary' | 'info' | 'danger' | 'neutral' | 'violet';
  value: string;
};

type PuzzleRow = {
  accessDisabled: boolean;
  attemptedAtLabel: string;
  firstAttemptLabel: string;
  id: string;
  note?: string | null;
  positionLabel: string;
  previewFen?: string | null;
  ratingLabel: string;
  ratingValueLabel: string;
  statusLabel: string;
  statusTone: 'success' | 'danger' | 'neutral';
  attemptsLabel: string;
};

type AttemptCard = {
  accent: 'success' | 'danger' | 'neutral';
  icon: LucideIcon;
  id: string;
  subtitle: string;
  timestamp: string;
  title: string;
};

const DETAIL_COLLECTION_PAGE_SIZE = 5;

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

function buildDetailBranding(training: Training) {
  return {
    icon: training.icon,
    iconBackgroundColor: training.iconBackgroundColor,
    iconColor: training.iconColor,
    logo: null,
  };
}

function formatCompactDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCompactDateTime(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDecimal(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }

  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
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

function getProgressDelta(cycleSummaries: TrainingCycleSummary[]) {
  if (cycleSummaries.length < 2) {
    return null;
  }

  return cycleSummaries[0].progressPercent - cycleSummaries[1].progressPercent;
}

function getSuccessRateValue(summary: TrainingSummary | null, analytics: TrainingAnalytics | null, cycleStats: CycleStats) {
  if (analytics?.performance.successRate !== undefined) {
    return Math.round(analytics.performance.successRate);
  }

  if (summary?.latestCycleSummary?.successRate !== undefined) {
    return Math.round(summary.latestCycleSummary.successRate);
  }

  if (cycleStats.total <= 0) {
    return 0;
  }

  return Math.round((cycleStats.solved / cycleStats.total) * 100);
}

function getAverageAttemptsValue(summary: TrainingSummary | null, cycleStats: CycleStats) {
  const directValue = summary?.latestCycleSummary?.averageAttempts ?? null;
  if (directValue !== null && directValue !== undefined) {
    return directValue;
  }

  const attemptedPuzzleCount = cycleStats.solved + cycleStats.failed;
  if (attemptedPuzzleCount <= 0) {
    return null;
  }

  const totalAttempts = summary?.latestCycleSummary?.attemptCount ?? summary?.attemptCount ?? 0;
  if (totalAttempts <= 0) {
    return null;
  }

  return totalAttempts / attemptedPuzzleCount;
}

function getPuzzleAttemptSummary(
  trainingPuzzle: TrainingPuzzle,
  cyclePuzzle: CyclePuzzle | null,
  latestAttempts: TrainingAttemptSummary[],
) {
  const attempt = latestAttempts.find((item) => item.trainingPuzzlePosition === trainingPuzzle.position) ?? null;

  if (!cyclePuzzle) {
    return {
      attemptedAtLabel: '—',
      attemptsLabel: '—',
      firstAttemptLabel: '—',
      statusLabel: 'Non tenté',
      statusTone: 'neutral' as const,
    };
  }

  if (cyclePuzzle.status === 'pending') {
    return {
      attemptedAtLabel: '—',
      attemptsLabel: '—',
      firstAttemptLabel: '—',
      statusLabel: 'Non tenté',
      statusTone: 'neutral' as const,
    };
  }

  if (!attempt) {
    return {
      attemptedAtLabel: '—',
      attemptsLabel: '—',
      firstAttemptLabel: '—',
      statusLabel: cyclePuzzle.status === 'solved' ? 'Résolu' : 'Raté',
      statusTone: cyclePuzzle.status === 'solved' ? ('success' as const) : ('danger' as const),
    };
  }

  const firstAttemptLabel = attempt.successful && attempt.mistakesCount === 0
    ? 'Oui'
    : cyclePuzzle.status === 'solved'
      ? 'Non'
      : 'Non';

  return {
    attemptedAtLabel: formatCompactDateTime(attempt.attemptedAt),
    attemptsLabel: '—',
    firstAttemptLabel,
    statusLabel: cyclePuzzle.status === 'solved' ? 'Résolu' : 'Raté',
    statusTone: cyclePuzzle.status === 'solved' ? ('success' as const) : ('danger' as const),
  };
}

function buildPuzzleRows(
  trainingPuzzles: TrainingPuzzle[],
  cyclePuzzles: CyclePuzzle[],
  latestAttempts: TrainingAttemptSummary[],
  hasStartedCycle: boolean,
): PuzzleRow[] {
  return trainingPuzzles.map((trainingPuzzle) => {
    const puzzle = typeof trainingPuzzle.puzzle === 'string' ? null : trainingPuzzle.puzzle;
    const cyclePuzzle = cyclePuzzles.find((item) => item.trainingPuzzle === trainingPuzzle['@id']) ?? null;
    const attemptSummary = getPuzzleAttemptSummary(trainingPuzzle, cyclePuzzle, latestAttempts);

    return {
      accessDisabled: !hasStartedCycle,
      attemptedAtLabel: attemptSummary.attemptedAtLabel,
      firstAttemptLabel: attemptSummary.firstAttemptLabel,
      id: trainingPuzzle['@id'],
      note: trainingPuzzle.personalNote ?? null,
      positionLabel: String(trainingPuzzle.position + 1),
      previewFen: puzzle?.fen,
      ratingLabel: getDifficultyLabel(puzzle?.rating),
      ratingValueLabel: puzzle?.rating ? String(puzzle.rating) : '—',
      statusLabel: attemptSummary.statusLabel,
      statusTone: attemptSummary.statusTone,
      attemptsLabel: attemptSummary.attemptsLabel,
    };
  });
}

function buildStats(
  totalProblems: number,
  cycleStats: CycleStats,
  summary: TrainingSummary | null,
  analytics: TrainingAnalytics | null,
  hasStartedCycle: boolean,
): DetailStat[] {
  const successRate = getSuccessRateValue(summary, analytics, cycleStats);
  const delta = getProgressDelta(summary?.cycleSummaries ?? []);
  const averageAttempts = getAverageAttemptsValue(summary, cycleStats);

  return [
    {
      icon: CheckCircle2,
      label: 'Taux de réussite',
      meta: hasStartedCycle ? 'Premier coup' : '—',
      tone: 'success',
      value: `${successRate}%`,
    },
    {
      icon: delta === null ? CircleOff : delta >= 0 ? TrendingUp : TrendingDown,
      label: 'Progression',
      meta: delta === null ? 'Premier cycle' : 'vs cycle précédent',
      tone: 'primary',
      value: delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`,
    },
    {
      icon: List,
      label: 'Problèmes',
      meta: 'Total',
      tone: 'info',
      value: String(totalProblems),
    },
    {
      icon: CheckCircle2,
      label: 'Résolus',
      meta: totalProblems > 0 ? `${Math.round((cycleStats.solved / totalProblems) * 100)} %` : '0 %',
      tone: 'success',
      value: String(cycleStats.solved),
    },
    {
      icon: XCircle,
      label: 'Ratés',
      meta: totalProblems > 0 ? `${Math.round((cycleStats.failed / totalProblems) * 100)} %` : '0 %',
      tone: 'danger',
      value: String(cycleStats.failed),
    },
    {
      icon: Clock3,
      label: 'Restants',
      meta: totalProblems > 0 ? `${Math.round((cycleStats.pending / totalProblems) * 100)} %` : '0 %',
      tone: 'neutral',
      value: String(cycleStats.pending),
    },
    {
      icon: RefreshCw,
      label: 'Tentatives moyennes',
      meta: hasStartedCycle ? 'moyenne' : '—',
      tone: 'violet',
      value: formatDecimal(averageAttempts),
    },
  ];
}

function buildAttemptCards(latestAttempts: TrainingAttemptSummary[]): AttemptCard[] {
  return latestAttempts.slice(0, 5).map((attempt) => {
    const successfulOnFirstTry = attempt.successful && attempt.mistakesCount === 0;

    return {
      accent: attempt.successful ? 'success' : 'danger',
      icon: attempt.successful ? CheckCircle2 : XCircle,
      id: attempt['@id'],
      subtitle: successfulOnFirstTry
        ? 'Réussi du premier coup'
        : attempt.successful
          ? 'Réussi après plusieurs essais'
          : 'Échec enregistré',
      timestamp: formatDateTime(attempt.attemptedAt),
      title: attempt.successful ? 'Réussi' : 'Raté',
    };
  });
}

function buildPaginationItems(pageCount: number, currentPage: number) {
  if (pageCount <= 1) {
    return [1];
  }

  const pages = new Set<number>([1, pageCount, currentPage, currentPage - 1, currentPage + 1]);
  const orderedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right);

  const items: Array<number | 'ellipsis'> = [];
  orderedPages.forEach((page, index) => {
    const previousPage = orderedPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      items.push('ellipsis');
    }
    items.push(page);
  });

  return items;
}
function buildCyclePeriod(cycle: Cycle | null) {
  if (!cycle?.startedAt) {
    return 'Date indisponible';
  }

  const start = formatCompactDate(cycle.startedAt);
  const end = cycle.completedAt ? formatCompactDate(cycle.completedAt) : getCycleStatusLabel(cycle.status);
  return `${start} - ${end}`;
}

function getCycleSupportText(cycle: Cycle | null, cycleStatusLabel: string) {
  if (!cycle?.startedAt) {
    return cycleStatusLabel;
  }

  const start = new Date(cycle.startedAt).getTime();
  if (Number.isNaN(start)) {
    return cycleStatusLabel;
  }

  const days = Math.max(Math.ceil((Date.now() - start) / 86400000), 0);
  return `${days} jour${days > 1 ? 's' : ''} depuis le démarrage`;
}

function DetailHeader({
  canStartCycle,
  hasStartedCycle,
  onEditTraining,
  onImport,
  onOpenSolver,
  onStartCycle,
  selectedTraining,
  startCycleIsPending,
}: {
  canStartCycle: boolean;
  hasStartedCycle: boolean;
  onEditTraining: () => void;
  onImport: () => void;
  onOpenSolver: () => void;
  onStartCycle: () => void;
  selectedTraining: Training;
  startCycleIsPending: boolean;
}) {
  const branding = buildDetailBranding(selectedTraining);

  return (
    <header className="wp-detail-header">
      <div className="wp-detail-header__identity">
        <div className="wp-detail-header__badge">
          <TrainingLogoBadge size="lg" training={branding} />
        </div>
        <div className="wp-detail-header__copy">
          <h1>{selectedTraining.name}</h1>
          {selectedTraining.description?.trim() ? <p>{selectedTraining.description}</p> : null}
        </div>
      </div>

      <div className="wp-detail-header__actions">
        <button className="wp-secondary wp-detail-button" type="button" onClick={onEditTraining}>
          <Pencil aria-hidden="true" size={16} strokeWidth={2} />
          <span>Modifier l'entraînement</span>
        </button>

        {hasStartedCycle ? (
          <button className="wp-primary wp-detail-button" type="button" onClick={onOpenSolver}>
            <Play aria-hidden="true" size={16} strokeWidth={2} />
            <span>Ouvrir le solveur</span>
          </button>
        ) : (
          <>
            <button className="wp-secondary wp-detail-button" type="button" onClick={onImport}>
              <FileUp aria-hidden="true" size={16} strokeWidth={2} />
              <span>Importer des puzzles</span>
            </button>
            <button className="wp-primary wp-detail-button" disabled={!canStartCycle || startCycleIsPending} type="button" onClick={onStartCycle}>
              <Play aria-hidden="true" size={16} strokeWidth={2} />
              <span>{startCycleIsPending ? 'Démarrage...' : 'Démarrer le cycle'}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function DetailStatGrid({ stats }: { stats: DetailStat[] }) {
  return (
    <section className="wp-detail-stats" aria-label="Statistiques de l'entraînement">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <article key={stat.label} className={`wp-detail-stat-card is-${stat.tone}`}>
            <div className="wp-detail-stat-card__icon">
              <Icon aria-hidden="true" size={18} strokeWidth={2} />
            </div>
            <div className="wp-detail-stat-card__label">{stat.label}</div>
            <strong className="wp-detail-stat-card__value">{stat.value}</strong>
          </article>
        );
      })}
    </section>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const style = {
    '--detail-progress': `${Math.max(Math.min(percent, 100), 0)}%`,
  } as CSSProperties;

  return (
    <div className="wp-detail-cycle-ring" style={style}>
      <div>
        <strong>{percent}%</strong>
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
            <span className={cellClassName} key={`${rowIndex}-${columnIndex}`}>
              {piece ? PIECE_SYMBOLS[piece] ?? '' : ''}
            </span>
          );
        }),
      )}
    </span>
  );
}

function DetailCollection({
  hasStartedCycle,
  onPuzzleSelect,
  rows,
  totalProblems,
}: {
  hasStartedCycle: boolean;
  onPuzzleSelect: (trainingPuzzleIri: string) => void;
  rows: PuzzleRow[];
  totalProblems: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / DETAIL_COLLECTION_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const startIndex = (safeCurrentPage - 1) * DETAIL_COLLECTION_PAGE_SIZE;
  const endIndex = Math.min(startIndex + DETAIL_COLLECTION_PAGE_SIZE, rows.length);
  const paginatedRows = rows.slice(startIndex, endIndex);
  const paginationItems = buildPaginationItems(pageCount, safeCurrentPage);

  const openPuzzle = (row: PuzzleRow) => {
    if (!hasStartedCycle || row.accessDisabled) {
      return;
    }

    onPuzzleSelect(row.id);
  };

  return (
    <section className="wp-panel wp-detail-section wp-detail-collection">
      <div className="wp-detail-section__header">
        <div>
          <h2>Collection de problèmes</h2>
          <p>{totalProblems} problème{totalProblems > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="wp-detail-collection__table-wrap">
        <table className="wp-detail-collection__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Aperçu</th>
              <th>Statut</th>
              <th>Difficulté</th>
              <th>Réussite</th>
              <th>Tentatives</th>
              <th>Dernière tentative</th>
              <th>Accès</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id}>
                <td>{row.positionLabel}</td>
                <td>
                  <button
                    className="wp-detail-problem-preview"
                    disabled={row.accessDisabled}
                    type="button"
                    onClick={() => openPuzzle(row)}
                  >
                    <PuzzlePreview fen={row.previewFen} />
                  </button>
                </td>
                <td>
                  <span className={`wp-detail-badge is-${row.statusTone}`}>{row.statusLabel}</span>
                </td>
                <td>{row.ratingValueLabel}</td>
                <td>{row.firstAttemptLabel}</td>
                <td>{row.attemptsLabel}</td>
                <td>{row.attemptedAtLabel}</td>
                <td>
                  <button
                    aria-label={`Accéder au problème ${row.positionLabel}`}
                    className="wp-detail-arrow-button"
                    disabled={row.accessDisabled}
                    type="button"
                    onClick={() => openPuzzle(row)}
                  >
                    <ChevronRight aria-hidden="true" size={18} strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="wp-detail-collection__mobile-list">
        {paginatedRows.map((row) => (
          <button
            key={`mobile-${row.id}`}
            className="wp-detail-collection-card"
            disabled={row.accessDisabled}
            type="button"
            onClick={() => openPuzzle(row)}
          >
            <span className="wp-detail-collection-card__preview">
              <PuzzlePreview fen={row.previewFen} />
            </span>
            <span className="wp-detail-collection-card__copy">
              <span className="wp-detail-collection-card__head">
                <strong>Problème {row.positionLabel}</strong>
              </span>
              <span className="wp-detail-collection-card__meta">
                <span className={`wp-detail-badge is-${row.statusTone}`}>{row.statusLabel}</span>
                <span className="wp-detail-collection-card__elo">{row.ratingValueLabel}</span>
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="wp-detail-collection-card__arrow" size={18} strokeWidth={2} />
          </button>
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="wp-detail-collection__pagination">
          <span className="wp-detail-collection__pagination-copy">
            {startIndex + 1} à {endIndex} sur {rows.length} problème{rows.length > 1 ? 's' : ''}
          </span>

          <div className="wp-detail-collection__pagination-controls">
            <button
              aria-label="Page précédente"
              className="wp-detail-pagination-button"
              disabled={safeCurrentPage === 1}
              type="button"
              onClick={() => setCurrentPage(safeCurrentPage - 1)}
            >
              <ChevronLeft aria-hidden="true" size={16} strokeWidth={2} />
            </button>

            {paginationItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span className="wp-detail-pagination-ellipsis" key={`ellipsis-${index}`}>
                  …
                </span>
              ) : (
                <button
                  aria-current={item === safeCurrentPage ? 'page' : undefined}
                  className={item === safeCurrentPage ? 'wp-detail-pagination-button is-active' : 'wp-detail-pagination-button'}
                  key={item}
                  type="button"
                  onClick={() => setCurrentPage(item)}
                >
                  {item}
                </button>
              ),
            )}

            <button
              aria-label="Page suivante"
              className="wp-detail-pagination-button"
              disabled={safeCurrentPage === pageCount}
              type="button"
              onClick={() => setCurrentPage(safeCurrentPage + 1)}
            >
              <ChevronRight aria-hidden="true" size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getDifficultyToneFromLabel(label: string): 'primary' | 'neutral' | 'violet' | 'info' {
  switch (label) {
    case 'Facile':
      return 'info';
    case 'Moyen':
      return 'primary';
    case 'Difficile':
      return 'violet';
    default:
      return 'neutral';
  }
}

function DetailCycleStatus({
  currentCycle,
  cycleStats,
  cycleStatusLabel,
}: {
  currentCycle: Cycle | null;
  cycleStats: CycleStats;
  cycleStatusLabel: string;
}) {
  return (
    <section className="wp-panel wp-detail-section wp-detail-cycle-status">
      <div className="wp-detail-section__header">
        <div>
          <h2>Statut du cycle</h2>
        </div>
      </div>

      <div className="wp-detail-cycle-status__grid">
        <div className="wp-detail-cycle-status__summary">
          <ProgressRing percent={cycleStats.progressPercent} />
          <div>
            <strong>{currentCycle ? `Cycle ${currentCycle.number}` : 'Cycle en cours'}</strong>
            <p>{buildCyclePeriod(currentCycle)}</p>
            <small>{getCycleSupportText(currentCycle, cycleStatusLabel)}</small>
          </div>
        </div>

        <div className="wp-detail-cycle-status__lock">
          <span className="wp-detail-cycle-status__lock-icon">
            <Lock aria-hidden="true" size={18} strokeWidth={2} />
          </span>
          <div>
            <strong>Collection verrouillée</strong>
            <p>Terminez le cycle actuel pour débloquer de nouveaux problèmes.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailCycleHistory({ cycleSummaries }: { cycleSummaries: TrainingCycleSummary[] }) {
  return (
    <section className="wp-panel wp-detail-section wp-detail-side-section">
      <div className="wp-detail-section__header">
        <div>
          <h2>Historique des cycles</h2>
        </div>
        {cycleSummaries.length > 0 ? <span className="wp-detail-section__link">Voir tout</span> : null}
      </div>

      {cycleSummaries.length === 0 ? (
        <p className="wp-empty">Aucun cycle enregistré pour le moment.</p>
      ) : (
        <div className="wp-detail-side-list">
          {cycleSummaries.slice(0, 3).map((item, index) => (
            <article key={item.cycle['@id']} className="wp-detail-side-row wp-detail-side-row--history">
              <div className="wp-detail-side-row__copy">
                <strong>
                  {`Cycle ${item.cycle.number}`}
                  {index === 0 && item.cycle.status === 'active' ? ' (en cours)' : ''}
                </strong>
                <small>{buildCyclePeriod(item.cycle)}</small>
              </div>
              <div className="wp-detail-side-row__metrics">
                <span className="wp-detail-side-row__metric">
                  <strong className="tone-success">{item.successRate !== undefined ? `${Math.round(item.successRate)} %` : `${item.solved}`}</strong>
                  <small>Réussite</small>
                </span>
                <span className="wp-detail-side-row__metric">
                  <strong className="tone-primary">{item.progressPercent}%</strong>
                  <small>Progression</small>
                </span>
              </div>
              <ChevronRight aria-hidden="true" className="wp-detail-side-row__arrow" size={16} strokeWidth={2} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailRecentAttempts({ attempts }: { attempts: AttemptCard[] }) {
  return (
    <section className="wp-panel wp-detail-section wp-detail-side-section">
      <div className="wp-detail-section__header">
        <div>
          <h2>Dernières tentatives</h2>
        </div>
        {attempts.length > 0 ? <span className="wp-detail-section__link">Voir tout</span> : null}
      </div>

      {attempts.length === 0 ? (
        <p className="wp-empty">Aucune tentative sauvegardée pour le moment.</p>
      ) : (
        <div className="wp-detail-side-list">
          {attempts.map((attempt) => {
            const Icon = attempt.icon;
            return (
              <article key={attempt.id} className="wp-detail-side-row wp-detail-side-row--attempt">
                <span className={`wp-detail-side-row__status is-${attempt.accent}`}>
                  <Icon aria-hidden="true" size={14} strokeWidth={2} />
                </span>
                <div className="wp-detail-side-row__copy">
                  <strong>{attempt.title}</strong>
                  <small>{attempt.subtitle}</small>
                </div>
                <span className="wp-detail-side-row__timestamp">{attempt.timestamp}</span>
                <ChevronRight aria-hidden="true" className="wp-detail-side-row__arrow" size={16} strokeWidth={2} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DetailInfoBanner({ children }: { children: ReactNode }) {
  return (
    <section className="wp-panel wp-detail-info-banner">
      <span className="wp-detail-info-banner__icon">
        <Info aria-hidden="true" size={18} strokeWidth={2} />
      </span>
      <div>{children}</div>
    </section>
  );
}

export function DetailView({
  analytics,
  analyticsError,
  analyticsIsError,
  analyticsIsLoading,
  currentCycle,
  cyclePuzzles,
  cycleStats,
  cycleStatusLabel,
  hasResumableCycle,
  onBackToDashboard,
  onEditTraining,
  onImport,
  onOpenSolver,
  onPuzzleSelect,
  onStartCycle,
  puzzleCount,
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

  const cycleSummaries = summary?.cycleSummaries ?? [];
  const latestCycleSummary = summary?.latestCycleSummary ?? cycleSummaries[0] ?? null;
  const latestAttempts = summary?.latestAttempts ?? [];
  const hasStartedCycle = Boolean(currentCycle || latestCycleSummary || hasResumableCycle || cyclePuzzles.length > 0);
  const totalProblems = summary?.puzzleCount ?? trainingPuzzles.length ?? puzzleCount;
  const stats = buildStats(totalProblems, cycleStats, summary, analytics, hasStartedCycle);
  const puzzleRows = buildPuzzleRows(trainingPuzzles, cyclePuzzles, latestAttempts, hasStartedCycle);
  const attemptCards = buildAttemptCards(latestAttempts);
  const canStartCycle = trainingPuzzles.length > 0;

  return (
    <div className="wp-page wp-detail-page">
      <DetailHeader
        canStartCycle={canStartCycle}
        hasStartedCycle={hasStartedCycle}
        onEditTraining={onEditTraining}
        onImport={onImport}
        onOpenSolver={onOpenSolver}
        onStartCycle={onStartCycle}
        selectedTraining={selectedTraining}
        startCycleIsPending={startCycleIsPending}
      />

      {startCycleIsError && startCycleError ? <p className="alert error-alert">{startCycleError}</p> : null}
      {trainingPuzzlesIsError && trainingPuzzlesError ? <p className="alert error-alert">{trainingPuzzlesError}</p> : null}
      {summaryIsError && summaryError ? <p className="alert error-alert">{summaryError}</p> : null}
      {analyticsIsError && analyticsError ? <p className="alert error-alert">{analyticsError}</p> : null}

      <DetailStatGrid stats={stats} />

      {trainingPuzzlesIsLoading ? <p className="wp-empty">Chargement des problèmes...</p> : null}
      {summaryIsLoading && hasStartedCycle ? <p className="wp-empty">Chargement du cycle...</p> : null}
      {analyticsIsLoading && hasStartedCycle ? <p className="wp-empty">Chargement des statistiques détaillées...</p> : null}

      {hasStartedCycle ? (
        <div className="wp-detail-layout">
          <div className="wp-detail-layout__main">
            <DetailCycleStatus currentCycle={currentCycle ?? latestCycleSummary?.cycle ?? null} cycleStats={cycleStats} cycleStatusLabel={cycleStatusLabel} />
            <DetailCollection hasStartedCycle={true} onPuzzleSelect={onPuzzleSelect} rows={puzzleRows} totalProblems={totalProblems} />
          </div>
          <div className="wp-detail-layout__side">
            <DetailCycleHistory cycleSummaries={cycleSummaries} />
            <DetailRecentAttempts attempts={attemptCards} />
          </div>
        </div>
      ) : (
        <div className="wp-detail-layout wp-detail-layout--single">
          <DetailCollection hasStartedCycle={false} onPuzzleSelect={onPuzzleSelect} rows={puzzleRows} totalProblems={totalProblems} />
          <DetailInfoBanner>
            <strong>Aucun cycle n'a encore été démarré.</strong>
            <p>Importez vos puzzles et lancez votre premier cycle pour commencer à vous entraîner.</p>
          </DetailInfoBanner>
        </div>
      )}
    </div>
  );
}

export default DetailView;










