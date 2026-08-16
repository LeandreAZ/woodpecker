import type { CSSProperties } from 'react';
import { PuzzleSolver, type PuzzleCompletionResult } from './PuzzleSolver';
import { PageHeader } from './TrainingsViewPrimitives';
import { mistakeLimitOptions } from './trainingsTypes';
import type { CyclePuzzle, CycleStats, Puzzle, Training, TrainingPuzzle } from './trainingsTypes';
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
  trainingPuzzles: TrainingPuzzle[];
};

function SolverView({
  attemptError,
  attemptIsError,
  attemptIsPending,
  cycleIsFinished,
  cycleStats,
  currentCyclePuzzle,
  cyclePuzzles,
  failedCyclePuzzleIris,
  hasActiveCycle,
  mistakeLimit,
  mistakeLimitError,
  mistakeLimitIsError,
  mistakeLimitIsPending,
  onBackToDashboard,
  onMistakeLimitChange,
  onBackToDetail,
  onPuzzleCompleted,
  onPuzzleFailed,
  onPuzzleSelect,
  savedCyclePuzzleIris,
  selectedPuzzle,
  selectedTraining,
  selectedTrainingPuzzle,
  trainingPuzzles,
}: SolverViewProps) {
  const currentCyclePuzzleIsSolved = currentCyclePuzzle ? currentCyclePuzzle.status === 'solved' || savedCyclePuzzleIris.has(currentCyclePuzzle['@id']) : false;
  const currentCyclePuzzleIsFailed = currentCyclePuzzle ? currentCyclePuzzle.status === 'failed' || failedCyclePuzzleIris.has(currentCyclePuzzle['@id']) : false;
  const currentPuzzleThemes = selectedPuzzle?.themes ?? [];
  const currentPuzzleRating = selectedPuzzle?.rating ?? null;
  const solvedCount = cycleStats.solved;
  const progressCount = Math.max(0, cycleStats.solved + cycleStats.failed);
  const progressPercent = trainingPuzzles.length > 0 ? Math.round((progressCount / trainingPuzzles.length) * 100) : 0;
  const progressRingStyle = { '--solver-progress': progressPercent } as CSSProperties;
  const selectedPosition = selectedTrainingPuzzle ? selectedTrainingPuzzle.position + 1 : null;
  const cycleStatusClassName = ['wp-cycle-status', hasActiveCycle ? 'active' : '', cycleIsFinished ? 'finished' : '', !hasActiveCycle && !cycleIsFinished ? 'free' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="wp-page solver-page">
      <PageHeader
        eyebrow="Solveur"
        title={selectedTraining ? selectedTraining.name : 'Aucun entrainement selectionne'}
        description="Resous les puzzles un par un avec un rendu proche de la session cible Woodpecker."
        action={
          <button className="wp-secondary" type="button" onClick={selectedTraining ? onBackToDetail : onBackToDashboard}>
            {selectedTraining ? 'Retour au detail' : 'Retour au tableau de bord'}
          </button>
        }
      />

      {!selectedTraining && (
        <div className="wp-empty-card">
          <h3>Aucun entrainement ouvert</h3>
          <p>Retourne au tableau de bord pour choisir un training, puis relance le solveur depuis sa page detail.</p>
          <button className="wp-primary" type="button" onClick={onBackToDashboard}>
            Ouvrir le tableau de bord
          </button>
        </div>
      )}

      {selectedTraining && trainingPuzzles.length === 0 && (
        <div className="wp-empty-card">
          <h3>Ce training ne contient pas encore de puzzle</h3>
          <p>Ajoute des puzzles manuellement ou importe un CSV avant d ouvrir une vraie session de resolution.</p>
          <button className="wp-primary" type="button" onClick={onBackToDetail}>
            Retour au detail du training
          </button>
        </div>
      )}

      {selectedTraining && trainingPuzzles.length > 0 && (
        <>
          <section className="wp-panel wp-solver-hero">
            <div className="wp-solver-hero-ring" style={progressRingStyle}>
              <div>
                <strong>{progressPercent}%</strong>
                <span>progression</span>
              </div>
            </div>

            <div className="wp-solver-hero-copy">
              <p className="eyebrow">Cycle actif</p>
              <h3>{hasActiveCycle ? 'Session en cours' : cycleIsFinished ? 'Cycle termine' : 'Mode libre'}</h3>
              <div className="wp-progress">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <small>{progressCount} / {trainingPuzzles.length} puzzles traites</small>
            </div>

            <div className="wp-solver-hero-metrics">
              <div>
                <span>Score</span>
                <strong>+{Math.max(0, solvedCount * 3)}</strong>
              </div>
              <div>
                <span>Performance</span>
                <strong>{currentPuzzleRating ?? 'Libre'}</strong>
              </div>
              <div>
                <span>Restants</span>
                <strong>{cycleStats.pending}</strong>
              </div>
            </div>
          </section>

          <section className="wp-panel wp-solver-settings-band">
            <div className="wp-solver-settings-copy">
              <span>Tolerance d erreurs</span>
            </div>
            <div className="wp-solver-settings-options">
              {mistakeLimitOptions.map((option) => (
                <button className={option === mistakeLimit ? 'active' : undefined} key={option} type="button" onClick={() => onMistakeLimitChange(option)}>
                  {option}
                </button>
              ))}
            </div>
            <div className="wp-solver-settings-meta">
              <span>Limite active</span>
              <strong>{mistakeLimit} erreur(s)</strong>
            </div>
          </section>

          <div className="wp-solver-layout-mockup">
            <aside className="wp-solver-list wp-panel">
              <div className="wp-solver-list-header">
                <p className="eyebrow">Puzzles ({trainingPuzzles.length})</p>
                <div className="wp-solver-list-summary wp-solver-list-summary-inline">
                  <div className="wp-solver-mini-stat">
                    <strong>{cycleStats.solved}</strong>
                    <span>Resolus</span>
                  </div>
                  <div className="wp-solver-mini-stat warning">
                    <strong>{cycleStats.failed}</strong>
                    <span>A revoir</span>
                  </div>
                </div>
              </div>

              <div className="wp-solver-puzzle-stack">
                {trainingPuzzles.map((trainingPuzzle) => {
                  const cyclePuzzle = cyclePuzzles.find((item) => item.trainingPuzzle === trainingPuzzle['@id']);
                  const trainingPuzzleDetails = typeof trainingPuzzle.puzzle === 'string' || trainingPuzzle.puzzle === null ? null : trainingPuzzle.puzzle;
                  const isSolved = cyclePuzzle ? cyclePuzzle.status === 'solved' || savedCyclePuzzleIris.has(cyclePuzzle['@id']) : false;
                  const isFailed = cyclePuzzle ? cyclePuzzle.status === 'failed' || failedCyclePuzzleIris.has(cyclePuzzle['@id']) : false;
                  const className = ['wp-solver-list-item', trainingPuzzle['@id'] === selectedTrainingPuzzle?.['@id'] ? 'active' : '', isSolved ? 'solved' : '', isFailed && !isSolved ? 'failed' : '']
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <button className={className} key={trainingPuzzle['@id']} type="button" onClick={() => onPuzzleSelect(trainingPuzzle['@id'])}>
                      <span>{trainingPuzzle.position + 1}</span>
                      <strong>{trainingPuzzleDetails?.rating ? `Rating ${trainingPuzzleDetails.rating}` : trainingPuzzleDetails?.themes[0] || 'Puzzle tactique'}</strong>
                      <small>{isSolved ? 'Resolu' : isFailed ? 'A revoir' : trainingPuzzle.position + 1 === selectedPosition ? 'En cours' : 'En attente'}</small>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="wp-solver-board-panel wp-panel">
              <div className={cycleStatusClassName}>
                <strong>{cycleIsFinished ? 'Cycle termine' : hasActiveCycle ? 'Cycle actif' : 'Mode libre'}</strong>
                <span>
                  {cycleIsFinished
                    ? `${cycleStats.solved} resolu(s), ${cycleStats.failed} a revoir. Retour au detail pour le bilan.`
                    : hasActiveCycle
                      ? `${cycleStats.solved} resolu(s), ${cycleStats.failed} a revoir, ${cycleStats.pending} restant(s)`
                      : 'Demarre un cycle depuis le detail pour sauvegarder les tentatives.'}
                </span>
              </div>

              <div className="wp-solver-focus-card-wide">
                <div>
                  <p className="eyebrow">Puzzle actif</p>
                  <h3>{selectedPosition ? `Puzzle ${selectedPosition}` : 'Puzzle en chargement'}</h3>
                </div>
                <div className="wp-inline-metrics">
                  <span>{currentPuzzleRating ? `Rating ${currentPuzzleRating}` : 'Rating libre'}</span>
                  <span>{currentPuzzleThemes.length > 0 ? currentPuzzleThemes.join(', ') : 'Sans theme'}</span>
                  <span>{hasActiveCycle ? 'Tentative suivie' : 'Mode libre'}</span>
                </div>
              </div>

              {mistakeLimitIsPending && <p className="alert info-alert">Sauvegarde de la tolerance...</p>}
              {mistakeLimitIsError && <p className="alert error-alert">{mistakeLimitError}</p>}
              {attemptIsPending && <p className="alert info-alert">Sauvegarde de la tentative...</p>}
              {attemptIsError && <p className="alert error-alert">{attemptError}</p>}
              {currentCyclePuzzleIsSolved && <p className="alert info-alert">Ce puzzle est deja sauvegarde comme resolu. Tu peux le rejouer sans creer de doublon.</p>}
              {currentCyclePuzzleIsFailed && !currentCyclePuzzleIsSolved && <p className="alert warning-alert">Ce puzzle est marque a revoir. Recommence-le pour tenter de le valider.</p>}

              {selectedTrainingPuzzle && selectedPuzzle ? (
                <PuzzleSolver
                  key={selectedTrainingPuzzle['@id']}
                  fen={selectedPuzzle.fen}
                  mistakeLimit={mistakeLimit}
                  onCompleted={currentCyclePuzzle && hasActiveCycle && !currentCyclePuzzleIsSolved ? onPuzzleCompleted : undefined}
                  onFailed={currentCyclePuzzle && hasActiveCycle && !currentCyclePuzzleIsSolved && !currentCyclePuzzleIsFailed ? onPuzzleFailed : undefined}
                  solution={selectedPuzzle.solution}
                />
              ) : (
                <p className="wp-empty">Chargement du puzzle selectionne...</p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export { SolverView };
export default SolverView;
