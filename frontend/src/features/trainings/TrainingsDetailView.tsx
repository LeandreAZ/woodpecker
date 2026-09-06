import { LoadingButton } from '../../components/ui/LoadingButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useState, type CSSProperties, type ReactNode } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Clock3,
  FileUp,
  Info,
  List,
  Lock,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from './TrainingsViewPrimitives';
import { Modal } from '../../components/ui';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { TrainingLogoBadge } from './TrainingBranding';
import { formatDateTime, formatStatsDuration, getCycleStatusLabel } from './trainingsUtils';
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
  onDeleteTraining: () => void;
  deleteTrainingIsPending: boolean;
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
  onViewAllAttemptHistory: () => void;
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
  statusTone: 'success' | 'danger' | 'neutral' | 'primary';
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

function hasCycleActivity(cycle: TrainingCycleSummary) {
  return (cycle.attemptCount ?? 0) > 0
    || (cycle.completedPuzzleCount ?? 0) > 0
    || cycle.solved > 0
    || cycle.failed > 0;
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

  const current = cycleSummaries[0].successRate ?? cycleSummaries[0].progressPercent;
  const previous = cycleSummaries[1].successRate ?? cycleSummaries[1].progressPercent;

  return current - previous;
}

function getSuccessRateValue(_summary: TrainingSummary | null, _analytics: TrainingAnalytics | null, cycleStats: CycleStats) {
  const attemptedPuzzleCount = cycleStats.solved + cycleStats.failed;
  if (attemptedPuzzleCount <= 0) {
    return 0;
  }

  return Math.round((cycleStats.solved / attemptedPuzzleCount) * 100);
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
  hasStartedCycle: boolean,
  currentCycleNumber?: number | null,
) {
  const cycleScopedAttempts = currentCycleNumber != null && latestAttempts.some((item) => item.cycleNumber != null)
    ? latestAttempts.filter((item) => item.cycleNumber === currentCycleNumber)
    : latestAttempts;
  const attempt = cycleScopedAttempts.find((item) => item.trainingPuzzlePosition === trainingPuzzle.position) ?? null;

  if (!cyclePuzzle) {
    return {
      attemptedAtLabel: '—',
      attemptsLabel: hasStartedCycle ? '0' : '—',
      firstAttemptLabel: '—',
      statusLabel: 'Non tenté',
      statusTone: 'neutral' as const,
    };
  }

  if (cyclePuzzle.status === 'pending') {
    return {
      attemptedAtLabel: '—',
      attemptsLabel: '0',
      firstAttemptLabel: '—',
      statusLabel: 'Non tenté',
      statusTone: 'neutral' as const,
    };
  }

  if (!attempt) {
    return {
      attemptedAtLabel: formatCompactDateTime(cyclePuzzle.completedAt),
      attemptsLabel: String(cyclePuzzle.attemptCount ?? cyclePuzzle.completedAttemptCount ?? cyclePuzzle.attempts?.filter((item) => item.status !== 'in_progress').length ?? 1),
      firstAttemptLabel: '—',
      statusLabel: cyclePuzzle.status === 'solved' ? 'Résolu' : cyclePuzzle.status === 'in_progress' ? 'En cours' : 'Raté',
      statusTone: cyclePuzzle.status === 'solved' ? ('success' as const) : cyclePuzzle.status === 'in_progress' ? ('primary' as const) : ('danger' as const),
    };
  }

  const firstAttemptLabel = attempt.successful && attempt.mistakesCount === 0
    ? 'Oui'
    : cyclePuzzle.status === 'solved'
      ? 'Non'
      : 'Non';

  return {
    attemptedAtLabel: formatCompactDateTime(cyclePuzzle.completedAt ?? attempt.attemptedAt),
    attemptsLabel: String(cyclePuzzle.attemptCount ?? cyclePuzzle.completedAttemptCount ?? cyclePuzzle.attempts?.filter((item) => item.status !== 'in_progress').length ?? 1),
    firstAttemptLabel,
    statusLabel: cyclePuzzle.status === 'solved' ? 'Résolu' : cyclePuzzle.status === 'in_progress' ? 'En cours' : 'Raté',
    statusTone: cyclePuzzle.status === 'solved' ? ('success' as const) : cyclePuzzle.status === 'in_progress' ? ('primary' as const) : ('danger' as const),
  };
}

function buildPuzzleRows(
  trainingPuzzles: TrainingPuzzle[],
  cyclePuzzles: CyclePuzzle[],
  latestAttempts: TrainingAttemptSummary[],
  hasStartedCycle: boolean,
  currentCycleNumber?: number | null,
): PuzzleRow[] {
  return trainingPuzzles.map((trainingPuzzle) => {
    const puzzle = typeof trainingPuzzle.puzzle === 'string' ? null : trainingPuzzle.puzzle;
    const cyclePuzzle = cyclePuzzles.find((item) => item.trainingPuzzle === trainingPuzzle['@id']) ?? null;
    const attemptSummary = getPuzzleAttemptSummary(trainingPuzzle, cyclePuzzle, latestAttempts, hasStartedCycle, currentCycleNumber);

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
  const hasPlayedPuzzle = cycleStats.solved + cycleStats.failed > 0;
  const successRate = getSuccessRateValue(summary, analytics, cycleStats);
  const delta = getProgressDelta(summary?.cycleSummaries ?? []);
  const averageAttempts = getAverageAttemptsValue(summary, cycleStats);

  return [
    {
      icon: CheckCircle2,
      label: 'Taux de réussite',
      tone: 'success',
      value: hasPlayedPuzzle ? `${successRate}%` : '—',
    },
    {
      icon: !hasPlayedPuzzle || delta === null ? CircleOff : delta >= 0 ? TrendingUp : TrendingDown,
      label: 'Progression',
      tone: 'primary',
      value: !hasPlayedPuzzle || delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`,
    },
    {
      icon: List,
      label: 'Problèmes',
      tone: 'info',
      value: String(totalProblems),
    },
    {
      icon: CheckCircle2,
      label: 'Résolus',
      tone: 'success',
      value: String(cycleStats.solved),
    },
    {
      icon: XCircle,
      label: 'Ratés',
      tone: 'danger',
      value: String(cycleStats.failed),
    },
    {
      icon: Clock3,
      label: 'Restants',
      tone: 'neutral',
      value: String(cycleStats.pending),
    },
    {
      icon: RefreshCw,
      label: 'Tentatives moyennes',
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
  const end = cycle.completedAt ? formatCompactDate(cycle.completedAt) : 'Dates indisponibles';
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
  canOpenSolver,
  canShowStartCycle,
  deleteTrainingIsPending,
  hasCycleHistory,
  onDeleteTraining,
  onEditTraining,
  onImport,
  onOpenSolver,
  onStartCycle,
  selectedTraining,
  startCycleIsPending,
}: {
  canOpenSolver: boolean;
  canShowStartCycle: boolean;
  deleteTrainingIsPending: boolean;
  hasCycleHistory: boolean;
  onDeleteTraining: () => void;
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
          <h1 title={selectedTraining.name}>{selectedTraining.name}</h1>
          {selectedTraining.description?.trim() ? <p title={selectedTraining.description}>{selectedTraining.description}</p> : null}
        </div>
      </div>

      <div className="wp-detail-header__actions">
        {canOpenSolver && !canShowStartCycle ? (
          <button className="wp-primary wp-detail-button" type="button" onClick={onOpenSolver}>
            <Play aria-hidden="true" size={16} strokeWidth={2} />
            <span>Ouvrir le solveur</span>
          </button>
        ) : null}

        {canShowStartCycle ? (
          <LoadingButton loading={startCycleIsPending} loadingLabel="Démarrage…" className="wp-primary wp-detail-button" disabled={startCycleIsPending} type="button" onClick={onStartCycle}>
            <Play aria-hidden="true" size={16} strokeWidth={2} />
            <span>{startCycleIsPending ? 'Démarrage...' : hasCycleHistory ? 'Lancer le cycle suivant' : 'Démarrer le cycle'}</span>
          </LoadingButton>
        ) : null}

        {!hasCycleHistory ? (
          <button className="wp-secondary wp-detail-button" type="button" onClick={onImport}>
            <FileUp aria-hidden="true" size={16} strokeWidth={2} />
            <span>Importer des puzzles</span>
          </button>
        ) : null}

        <div className="wp-detail-header__action-group" role="group" aria-label="Actions de l'entraînement">
          <button aria-label="Modifier l'entraînement" className="wp-secondary wp-detail-button" title="Modifier l'entraînement" type="button" onClick={onEditTraining}>
            <Pencil aria-hidden="true" size={16} strokeWidth={2} /><span>Modifier</span>
          </button>
          <button aria-label="Supprimer l'entraînement" className="wp-secondary wp-detail-button wp-detail-button--danger" disabled={deleteTrainingIsPending} title="Supprimer l'entraînement" type="button" onClick={onDeleteTraining}>
            <Trash2 aria-hidden="true" size={16} strokeWidth={2} /><span>Supprimer</span>
          </button>
        </div>
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
  canOpenSolver,
  onPuzzleSelect,
  rows,
  totalProblems,
}: {
  canOpenSolver: boolean;
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
    if (!canOpenSolver || row.accessDisabled) {
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
              <th className="is-center">#</th>
              <th>Aperçu</th>
              <th className="is-center">Statut</th>
              <th className="is-center">Difficulté</th>
              <th className="is-center">Tentatives</th>
              <th className="is-center">Dernière tentative</th>
              <th className="is-center">Accès</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id}>
                <td className="is-center">{row.positionLabel}</td>
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
                <td className="is-center">
                  <span className={`wp-detail-badge is-${row.statusTone}`}>{row.statusLabel}</span>
                </td>
                <td className="is-center">{row.ratingValueLabel}</td>
                <td className="is-center">{row.attemptsLabel}</td>
                <td className="is-center">{row.attemptedAtLabel}</td>
                <td className="is-center">
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
            <p>Un cycle a déjà démarré, la collection des problèmes est définitivement verrouillée.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailCycleHistory({ cycleSummaries, onViewAll }: { cycleSummaries: TrainingCycleSummary[]; onViewAll: () => void; }) {
  return (
    <section className="wp-panel wp-detail-section wp-detail-side-section">
      <div className="wp-detail-section__header">
        <div>
          <h2>Historique des cycles</h2>
        </div>
        {cycleSummaries.length > 0 ? <button className="wp-detail-section__link" type="button" onClick={onViewAll}>Voir tout</button> : null}
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
                  <strong className="tone-success">{hasCycleActivity(item) ? (item.successRate !== undefined ? `${Math.round(item.successRate)} %` : `${item.solved}`) : '—'}</strong>
                  <small>Réussite</small>
                </span>
                <span className="wp-detail-side-row__metric">
                  <strong className="tone-primary">{!hasCycleActivity(item) || item.progressDelta === null || item.progressDelta === undefined ? '—' : `${item.progressDelta > 0 ? '+' : ''}${item.progressDelta}%`}</strong>
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

function DetailRecentAttempts({ attempts, onViewAll }: { attempts: AttemptCard[]; onViewAll: () => void; }) {
  return (
    <section className="wp-panel wp-detail-section wp-detail-side-section">
      <div className="wp-detail-section__header">
        <div>
          <h2>Dernières tentatives</h2>
        </div>
        {attempts.length > 0 ? <button className="wp-detail-section__link" type="button" onClick={onViewAll}>Voir tout</button> : null}
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

function DetailCycleHistoryModal({ cycleSummaries, onClose, open }: { cycleSummaries: TrainingCycleSummary[]; onClose: () => void; open: boolean; }) {
  return (
    <Modal contentClassName="ui-modal__content--plain" open={open} onClose={onClose}>
      <div className="wp-detail-modal-card">
        <div className="wp-detail-modal-card__header">
          <div>
            <h2>Historique des cycles</h2>
            <p>Consultez le détail de tous vos cycles d'entraînement.</p>
          </div>
          <button aria-label="Fermer" className="ui-modal-close wp-detail-modal-card__close" type="button" onClick={onClose}>
            <X aria-hidden="true" size={18} strokeWidth={1.9} />
          </button>
        </div>
        <div className="wp-detail-modal-card__divider" />
        {cycleSummaries.length === 0 ? (
          <p className="wp-empty">Aucun cycle enregistré pour le moment.</p>
        ) : (
          <div className="wp-detail-modal-table-wrap">
            <table className="wp-detail-modal-table">
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Période</th>
                  <th>Réussite</th>
                  <th>Progression</th>
                  <th>Tentatives</th>
                  <th>Temps</th>
                </tr>
              </thead>
              <tbody>
                {cycleSummaries.map((item, index) => {
                  const rowKey = item.cycle['@id'] ?? String(item.cycle.number) + '-' + String(index);
                  const cycleLabel = 'Cycle ' + String(item.cycle.number);
                  const active = hasCycleActivity(item);
                  const successLabel = !active ? '—' : item.successRate !== undefined ? String(Math.round(item.successRate)) + ' %' : '—';
                  const progressLabel = !active || item.progressDelta === null || item.progressDelta === undefined
                    ? '—'
                    : (item.progressDelta > 0 ? '+' : '') + String(item.progressDelta) + '%';

                  return (
                    <tr key={rowKey}>
                      <td>
                        {cycleLabel}
                        {index === 0 && item.cycle.status === 'active' ? ' (en cours)' : ''}
                      </td>
                      <td>{buildCyclePeriod(item.cycle)}</td>
                      <td><span className="wp-detail-cycle-value tone-success">{successLabel}</span></td>
                      <td><span className="wp-detail-cycle-value tone-primary">{progressLabel}</span></td>
                      <td><span className="wp-detail-cycle-value tone-info">{active ? item.attemptCount : '—'}</span></td>
                      <td>{formatStatsDuration(item.durationMilliseconds ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
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
  deleteTrainingIsPending,
  onDeleteTraining,
  onEditTraining,
  onImport,
  onOpenSolver,
  onPuzzleSelect,
  onStartCycle,
  onViewAllAttemptHistory,
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
  const [isCycleHistoryModalOpen, setIsCycleHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
  const hasCycleHistory = Boolean(currentCycle || latestCycleSummary || hasResumableCycle || cyclePuzzles.length > 0);
  const canOpenSolver = currentCycle?.status === 'active';
  const totalProblems = summary?.puzzleCount ?? trainingPuzzles.length ?? puzzleCount;
  const stats = buildStats(totalProblems, cycleStats, summary, analytics, hasCycleHistory);
  const puzzleRows = buildPuzzleRows(trainingPuzzles, cyclePuzzles, latestAttempts, canOpenSolver, currentCycle?.number ?? latestCycleSummary?.cycle.number);
  const attemptCards = buildAttemptCards(latestAttempts);
  const isCycleProgressComplete = cycleStats.total > 0 && cycleStats.pending === 0;
  const canShowStartCycle = trainingPuzzles.length > 0 && (!canOpenSolver || isCycleProgressComplete);

  return (
    <div className="wp-page wp-detail-page">
      <DetailHeader
        canShowStartCycle={canShowStartCycle}
        canOpenSolver={canOpenSolver}
        deleteTrainingIsPending={deleteTrainingIsPending}
        hasCycleHistory={hasCycleHistory}
        onDeleteTraining={() => setIsDeleteModalOpen(true)}
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
      {summaryIsLoading && hasCycleHistory ? <p className="wp-empty">Chargement du cycle...</p> : null}
      {analyticsIsLoading && hasCycleHistory ? <p className="wp-empty">Chargement des statistiques détaillées...</p> : null}

      {totalProblems === 0 && !trainingPuzzlesIsLoading ? <EmptyState title="Aucun puzzle" description="Importez des puzzles pour préparer votre premier cycle." action={<button type="button" className="wp-primary" onClick={onImport}>Importer des puzzles</button>} /> : hasCycleHistory ? (
        <div className="wp-detail-layout">
          <div className="wp-detail-layout__main">
            <DetailCycleStatus currentCycle={currentCycle ?? latestCycleSummary?.cycle ?? null} cycleStats={cycleStats} cycleStatusLabel={cycleStatusLabel} />
            <DetailCollection canOpenSolver={canOpenSolver} onPuzzleSelect={onPuzzleSelect} rows={puzzleRows} totalProblems={totalProblems} />
            {!canOpenSolver ? (
              <DetailInfoBanner>
                <strong>Aucun cycle actif n'est disponible.</strong>
                <p>Démarrez un nouveau cycle avant d'ouvrir un puzzle dans le solveur. Sans cycle actif, aucune tentative ni autosauvegarde ne peut être créée.</p>
              </DetailInfoBanner>
            ) : null}
          </div>
          <div className="wp-detail-layout__side">
            <DetailCycleHistory cycleSummaries={cycleSummaries} onViewAll={() => setIsCycleHistoryModalOpen(true)} />
            <DetailRecentAttempts attempts={attemptCards} onViewAll={onViewAllAttemptHistory} />
          </div>
        </div>
      ) : (
        <div className="wp-detail-layout wp-detail-layout--single">
          <DetailCollection canOpenSolver={false} onPuzzleSelect={onPuzzleSelect} rows={puzzleRows} totalProblems={totalProblems} />
          <DetailInfoBanner>
            <strong>Aucun cycle n'a encore été démarré.</strong>
            <p>Importez vos puzzles et lancez votre premier cycle pour commencer à vous entraîner.</p>
          </DetailInfoBanner>
        </div>
      )}

      <DetailCycleHistoryModal cycleSummaries={cycleSummaries} onClose={() => setIsCycleHistoryModalOpen(false)} open={isCycleHistoryModalOpen} />

      <ConfirmationModal
        confirmLabel="Supprimer"
        description="Cette action est irréversible."
        isDanger
        isPending={deleteTrainingIsPending}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDeleteTraining();
        }}
        open={isDeleteModalOpen}
        title="Supprimer l'entraînement ?"
      />
    </div>
  );
}

export default DetailView;










