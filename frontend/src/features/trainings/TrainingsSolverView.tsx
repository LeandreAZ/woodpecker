import { useEffect, useState, type CSSProperties } from 'react';
import * as AppIcons from '../../shared/AppIcons';
import { PuzzleSolver, type PuzzleCompletionResult } from './PuzzleSolver';
import type { CyclePuzzle, CycleStats, Puzzle, Training, TrainingPuzzle, TrainingSummary } from './trainingsTypes';
import './solver.css';

type SolverViewProps = {
  attemptError?: string;
  attemptIsError: boolean;
  attemptIsPending: boolean;
  cycleIsFinished: boolean;
  cycleStats: CycleStats;
  currentCyclePuzzle: CyclePuzzle | null;
  cyclePuzzles: CyclePuzzle[];
  failedCyclePuzzleIris: Set<string>;
  hasActiveCycle: boolean;
  mistakeLimit: number;
  mistakeLimitError?: string;
  mistakeLimitIsError: boolean;
  mistakeLimitIsPending: boolean;
  onBackToDashboard: () => void;
  onMistakeLimitChange: (value: number) => void;
  onBackToDetail: () => void;
  onPuzzleCompleted: (result: PuzzleCompletionResult) => void;
  onPuzzleFailed: (result: PuzzleCompletionResult) => void;
  onPuzzleSelect: (trainingPuzzleIri: string) => void;
  savedCyclePuzzleIris: Set<string>;
  selectedPuzzle?: Puzzle;
  selectedTraining: Training | null;
  selectedTrainingPuzzle: TrainingPuzzle | null;
  summary: TrainingSummary | null;
  trainingPuzzles: TrainingPuzzle[];
};

type PuzzleListTone = 'failed' | 'pending' | 'solved';

function formatCompactDate(value?: string | null) {
  if (!value) {
    return 'Date indisponible';
  }

  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes) + ':' + seconds.toString().padStart(2, '0');
}

function getCycleDelta(summary: TrainingSummary | null) {
  const cycleSummaries = summary?.cycleSummaries ?? [];
  if (cycleSummaries.length < 2) {
    return null;
  }

  return cycleSummaries[0].progressPercent - cycleSummaries[1].progressPercent;
}

function getPuzzleListStatus(cyclePuzzle: CyclePuzzle | undefined, isSaved: boolean, isFailed: boolean): { label: string; tone: PuzzleListTone } {
  if (cyclePuzzle?.status === 'solved' || isSaved) {
    return { label: 'Résolu', tone: 'solved' };
  }

  if (cyclePuzzle?.status === 'failed' || isFailed) {
    return { label: 'À revoir', tone: 'failed' };
  }

  return { label: 'Non tenté', tone: 'pending' };
}

function SolverView({
  attemptError,
  attemptIsError,
  attemptIsPending,
  cycleStats,
  currentCyclePuzzle,
  cyclePuzzles,
  failedCyclePuzzleIris,
  hasActiveCycle,
  onBackToDashboard,
  onBackToDetail,
  onPuzzleCompleted,
  onPuzzleFailed,
  onPuzzleSelect,
  savedCyclePuzzleIris,
  selectedPuzzle,
  selectedTraining,
  selectedTrainingPuzzle,
  summary,
  trainingPuzzles,
}: SolverViewProps) {
  const [puzzleStartedAt, setPuzzleStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const currentCyclePuzzleIsSolved = currentCyclePuzzle ? currentCyclePuzzle.status === 'solved' || savedCyclePuzzleIris.has(currentCyclePuzzle['@id']) : false;
  const currentCyclePuzzleIsFailed = currentCyclePuzzle ? currentCyclePuzzle.status === 'failed' || failedCyclePuzzleIris.has(currentCyclePuzzle['@id']) : false;
  const selectedPosition = selectedTrainingPuzzle ? selectedTrainingPuzzle.position + 1 : null;
  const currentIndex = selectedTrainingPuzzle ? trainingPuzzles.findIndex((item) => item['@id'] == selectedTrainingPuzzle['@id']) : -1;
  const previousPuzzle = currentIndex > 0 ? trainingPuzzles[currentIndex - 1] : null;
  const nextPuzzle = currentIndex >= 0 && currentIndex < trainingPuzzles.length - 1 ? trainingPuzzles[currentIndex + 1] : null;
  const latestCycleSummary = summary?.latestCycleSummary ?? null;
  const cycleProgressPercent = latestCycleSummary?.progressPercent ?? cycleStats.progressPercent;
  const cycleDelta = getCycleDelta(summary);
  const progressRingStyle = { '--solver-progress': cycleProgressPercent } as CSSProperties;
  const cycleNumber = latestCycleSummary?.cycle.number ?? 1;
  const cycleDateLabel = latestCycleSummary?.cycle.startedAt
    ? formatCompactDate(latestCycleSummary.cycle.startedAt) + (latestCycleSummary?.cycle.completedAt ? ' - ' + formatCompactDate(latestCycleSummary.cycle.completedAt) : '')
    : 'Date indisponible';
  const progressDeltaLabel = cycleDelta === null ? String(cycleProgressPercent) + '%' : (cycleDelta > 0 ? '+' : '') + String(cycleDelta) + '% ce cycle';
  const elapsedLabel = formatDuration(now - puzzleStartedAt);

  useEffect(() => {
    setPuzzleStartedAt(Date.now());
    setNow(Date.now());
  }, [selectedTrainingPuzzle?.['@id']]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!selectedTraining) {
    return (
      <div className="wp-page solver-page">
        <div className="wp-empty-card">
          <h3>Aucun entraînement ouvert</h3>
          <p>Retourne au tableau de bord pour choisir un entraînement, puis relance le solveur depuis sa page détail.</p>
          <button className="wp-primary" type="button" onClick={onBackToDashboard}>
            Ouvrir le tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (trainingPuzzles.length === 0) {
    return (
      <div className="wp-page solver-page">
        <div className="wp-empty-card">
          <h3>Ce training ne contient pas encore de puzzle</h3>
          <p>Ajoute des puzzles manuellement ou importe un CSV avant d’ouvrir une vraie session de résolution.</p>
          <button className="wp-primary" type="button" onClick={onBackToDetail}>
            Retour au détail du training
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wp-page solver-page solver-page-v2">
      <section className="wp-panel wp-solver-topbar-v2">
        <div className="wp-solver-topbar-v2__cycle">
          <div className="wp-solver-topbar-v2__ring" style={progressRingStyle}>
            <div>
              <strong>{String(cycleProgressPercent) + '%'}</strong>
            </div>
          </div>
          <div className="wp-solver-topbar-v2__cycle-copy">
            <div>
              <strong>{'Cycle ' + cycleNumber}</strong>
              <p>{cycleDateLabel}</p>
            </div>
          </div>
        </div>

        <div className="wp-solver-topbar-v2__metrics">
          <div className="wp-solver-topbar-v2__metric">
            <span className="wp-solver-topbar-v2__metric-icon tone-green"><AppIcons.TrendUpIcon /></span>
            <div>
              <strong>Progression</strong>
              <p>{String(cycleProgressPercent) + '%'}</p>
              <small>{progressDeltaLabel}</small>
            </div>
          </div>

          <div className="wp-solver-topbar-v2__metric">
            <span className="wp-solver-topbar-v2__metric-icon tone-blue"><AppIcons.HistoryIcon /></span>
            <div>
              <strong>Durée</strong>
              <p>{elapsedLabel}</p>
              <small>Puzzle en cours</small>
            </div>
          </div>
        </div>
      </section>

      <div className="wp-solver-layout-v2">
        <aside className="wp-panel wp-solver-list-v2">
          <div className="wp-solver-list-v2__header">
            <div>
              <h3>{selectedPosition ? 'Puzzle ' + String(selectedPosition) + ' / ' + String(trainingPuzzles.length) : 'Puzzles'}</h3>
            </div>
          </div>

          <div className="wp-solver-list-v2__table-head">
            <span>#</span>
            <span>Statut</span>
          </div>

          <div className="wp-solver-list-v2__body">
            {trainingPuzzles.map((trainingPuzzle) => {
              const cyclePuzzle = cyclePuzzles.find((item) => item.trainingPuzzle === trainingPuzzle['@id']);
              const isSaved = cyclePuzzle ? savedCyclePuzzleIris.has(cyclePuzzle['@id']) : false;
              const isFailed = cyclePuzzle ? failedCyclePuzzleIris.has(cyclePuzzle['@id']) : false;
              const status = getPuzzleListStatus(cyclePuzzle, isSaved, isFailed);
              const isActive = trainingPuzzle['@id'] === selectedTrainingPuzzle?.['@id'];
              const className = ['wp-solver-list-v2__row', isActive ? 'is-active' : '', status.tone === 'solved' ? 'is-solved' : '', status.tone === 'failed' ? 'is-failed' : '']
                .filter(Boolean)
                .join(' ');

              return (
                <button className={className} key={trainingPuzzle['@id']} type="button" onClick={() => onPuzzleSelect(trainingPuzzle['@id'])}>
                  <span>{trainingPuzzle.position + 1}</span>
                  <span className="wp-solver-list-v2__status">
                    {status.tone === 'solved' ? <AppIcons.CheckCircleIcon /> : status.tone === 'failed' ? <AppIcons.RepeatIcon /> : <AppIcons.HistoryIcon />}
                    <strong>{status.label}</strong>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="wp-panel wp-solver-board-panel-v2">
          <div className="wp-solver-board-panel-v2__alerts">
            {attemptIsPending ? <p className="alert info-alert">Sauvegarde de la tentative...</p> : null}
            {attemptIsError ? <p className="alert error-alert">{attemptError}</p> : null}
            {currentCyclePuzzleIsFailed && !currentCyclePuzzleIsSolved ? (
              <p className="alert error-alert">Ce puzzle est marqué à revoir. Vous avez déjà raté cette tentative sur le cycle en cours.</p>
            ) : null}
            {currentCyclePuzzleIsSolved ? <p className="alert info-alert">Ce puzzle est déjà validé pour ce cycle.</p> : null}
          </div>

          <div className="wp-solver-board-panel-v2__body">
            {selectedTrainingPuzzle && selectedPuzzle ? (
              <PuzzleSolver
                key={selectedTrainingPuzzle['@id']}
                fen={selectedPuzzle.fen}
                mistakeLimit={selectedTraining.mistakeLimit}
                onCompleted={currentCyclePuzzle && hasActiveCycle && !currentCyclePuzzleIsSolved ? onPuzzleCompleted : undefined}
                onFailed={currentCyclePuzzle && hasActiveCycle && !currentCyclePuzzleIsSolved && !currentCyclePuzzleIsFailed ? onPuzzleFailed : undefined}
                solution={selectedPuzzle.solution}
              />
            ) : (
              <p className="wp-empty">Chargement du puzzle sélectionné...</p>
            )}
          </div>

          <div className="wp-solver-board-nav-v2">
            <button className="wp-secondary wp-solver-nav-button" disabled={!previousPuzzle} type="button" onClick={() => previousPuzzle && onPuzzleSelect(previousPuzzle['@id'])}>
              <span>‹</span>
              <span>Précédent</span>
            </button>
            <button className="wp-primary wp-solver-nav-button" disabled={!nextPuzzle} type="button" onClick={() => nextPuzzle && onPuzzleSelect(nextPuzzle['@id'])}>
              <span>Suivant</span>
              <span>›</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export { SolverView };
export default SolverView;
