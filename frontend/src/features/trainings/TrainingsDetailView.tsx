import type { CycleStats, Training, TrainingAttemptSummary, TrainingCycleSummary, TrainingPuzzle, TrainingSummary } from './trainingsTypes';
import type { UseMutationResult } from '@tanstack/react-query';
import { PageHeader, Stat } from './TrainingsViewPrimitives';
import { formatDateTime, formatDuration, getCycleStatusLabel } from './trainingsUtils';

type DetailViewProps = {
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

export function DetailView(props: DetailViewProps) {
  const {
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
    return <div className="wp-page"><PageHeader eyebrow="Detail" title="Selectionne un entrainement" description="Retourne au tableau de bord pour ouvrir un entrainement existant." /></div>;
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

  return <div className="wp-page"><PageHeader eyebrow="Detail entrainement" title={selectedTraining.name} description={selectedTraining.description || 'Ajoute des puzzles, importe un CSV ou commence la resolution.'} action={<button className="wp-secondary" type="button" onClick={onOpenSolver}>Ouvrir le solveur</button>} /><div className="wp-stats"><Stat label="Puzzles" value={String(summaryPuzzleCount)} /><Stat label="Progression" value={`${cycleStats.progressPercent}%`} /><Stat label="Resolus" value={String(cycleStats.solved)} /><Stat label="A revoir" value={String(cycleStats.failed)} /><Stat label="Restants" value={String(cycleStats.pending)} /><Stat label="Tentatives" value={String(attemptCount)} /><Stat label="Cycle" value={cycleStatusLabel} /></div><div className="wp-detail-overview-grid"><section className="wp-panel wp-detail-highlight"><div className="wp-panel-title"><p className="eyebrow">Focus cycle</p><h3>{latestCycleSummary ? `Cycle ${latestCycleSummary.cycle.number}` : 'Cycle non lance'}</h3></div><p className="wp-detail-highlight-copy">{latestCycleSummary ? `${latestCycleSummary.solved} resolu(s), ${latestCycleSummary.failed} a revoir et ${latestCycleSummary.pending} restant(s).` : 'Prepare la liste de puzzles, puis demarre un cycle pour suivre les repetitions Woodpecker.'}</p><div className="wp-inline-metrics"><span>{hasResumableCycle ? 'Cycle reprenable' : 'Nouveau cycle possible'}</span><span>{solvedAttempts} tentative(s) reussie(s)</span><span>{averageMistakes} erreur(s) / tentative</span></div></section><section className="wp-panel wp-detail-highlight subdued"><div className="wp-panel-title"><p className="eyebrow">Collection</p><h3>Set de travail</h3></div><p className="wp-detail-highlight-copy">{puzzleListIsLocked ? 'La liste est figee pour conserver un set stable pendant les repetitions en cours.' : 'Tu peux encore enrichir, reordonner et nettoyer la liste avant de verrouiller un cycle.'}</p><div className="wp-inline-metrics"><span>{ratedPuzzleCount} puzzle(s) notes</span><span>{notedPuzzleCount} note(s) perso</span><span>{puzzleListIsLocked ? 'Edition verrouillee' : 'Edition ouverte'}</span></div></section></div><div className="wp-two-columns"><section className="wp-panel"><div className="wp-panel-title"><p className="eyebrow">Ajout manuel</p><h3>Ajouter un puzzle</h3></div>{puzzleListIsLocked && <p className="alert info-alert">La liste de puzzles est verrouillee car un cycle existe deja. C'est voulu : un training Woodpecker doit garder le meme set pendant ses repetitions.</p>}<form className="form-stack" onSubmit={(event) => { event.preventDefault(); if (!puzzleListIsLocked) { createPuzzleMutation.mutate(); } }}><label>FEN Lichess optionnelle<textarea disabled={puzzleListIsLocked} onChange={(event) => onFenChange(event.target.value)} placeholder="FEN Lichess si connue" rows={2} value={fen} /></label><label>Moves Lichess<input disabled={puzzleListIsLocked} onChange={(event) => onSolutionTextChange(event.target.value)} placeholder="ex: e2e4 e7e5 g1f3" required value={solutionText} /></label><div className="form-grid"><label>Themes<input disabled={puzzleListIsLocked} onChange={(event) => onThemesTextChange(event.target.value)} placeholder="fork, pin, mate" value={themesText} /></label><label>Rating<input disabled={puzzleListIsLocked} min={1} onChange={(event) => onRatingChange(event.target.value)} placeholder="1500" type="number" value={rating} /></label></div><label>Note perso<textarea disabled={puzzleListIsLocked} onChange={(event) => onPersonalNoteChange(event.target.value)} placeholder="Pourquoi ce puzzle est interessant ?" rows={3} value={personalNote} /></label>{createPuzzleMutation.isError && <p className="alert error-alert">{createPuzzleMutation.error.message}</p>}<button className="wp-primary" disabled={createPuzzleMutation.isPending || puzzleListIsLocked} type="submit">{createPuzzleMutation.isPending ? 'Ajout...' : 'Ajouter le puzzle'}</button></form></section><section className="wp-panel"><div className="wp-panel-title with-action"><div><p className="eyebrow">Puzzles</p><h3>Liste du training</h3></div><button className="wp-secondary" disabled={puzzleListIsLocked} type="button" onClick={onImport}>Importer CSV</button></div><div className="wp-inline-metrics wp-inline-metrics-spaced"><span>{summaryPuzzleCount} puzzle(s)</span><span>{themedPuzzleCount} avec themes</span><span>{puzzleListIsLocked ? 'Liste verrouillee' : 'Liste editable'}</span></div><div className="wp-cycle-actions"><button className="wp-primary full" disabled={startCycleIsPending || trainingPuzzles.length === 0} type="button" onClick={onStartCycle}>{startCycleIsPending ? hasResumableCycle ? 'Reprise...' : 'Demarrage...' : hasResumableCycle ? 'Reprendre le cycle' : 'Demarrer le cycle'}</button><p>{hasResumableCycle ? 'Rouvre le cycle actif existant et continue la resolution sans creer de doublon.' : 'Cree un cycle actif, prepare les puzzles du cycle, puis ouvre le solveur.'}</p></div>{startCycleIsError && <p className="alert error-alert">{startCycleError}</p>}{trainingPuzzlesIsLoading && <p className="wp-empty">Chargement des puzzles...</p>}{trainingPuzzlesIsError && <p className="alert error-alert">{trainingPuzzlesError}</p>}{deletePuzzleIsError && <p className="alert error-alert">{deletePuzzleError}</p>}{movePuzzleIsError && <p className="alert error-alert">{movePuzzleError}</p>}{!trainingPuzzlesIsLoading && trainingPuzzles.length === 0 && <p className="wp-empty">Aucun puzzle ajoute pour l'instant.</p>}<div className="wp-puzzle-table">{trainingPuzzles.map((trainingPuzzle, index) => { const puzzle = typeof trainingPuzzle.puzzle === 'string' ? null : trainingPuzzle.puzzle; return <div className="wp-puzzle-row-with-actions" key={trainingPuzzle['@id']}><button className="wp-puzzle-row" type="button" onClick={() => onPuzzleSelect(trainingPuzzle['@id'])}><span>#{trainingPuzzle.position + 1}</span><strong>{puzzle?.solution.join(' ') ?? 'Puzzle a charger'}</strong><em>{puzzle?.themes.join(', ') || trainingPuzzle.personalNote || 'Sans theme'}</em><small>{puzzle?.rating ? `Rating ${puzzle.rating}` : 'Rating libre'}{' - '}{trainingPuzzle.personalNote?.trim().length ? 'Note perso' : 'Sans note'}</small></button>{!puzzleListIsLocked && <div className="wp-puzzle-actions"><button aria-label={`Monter le puzzle ${trainingPuzzle.position + 1}`} className="wp-secondary wp-puzzle-action" disabled={movePuzzleIsPending || index === 0} title="Monter" type="button" onClick={() => onPuzzleMove(trainingPuzzle['@id'], 'up')}>Haut</button><button aria-label={`Descendre le puzzle ${trainingPuzzle.position + 1}`} className="wp-secondary wp-puzzle-action" disabled={movePuzzleIsPending || index === trainingPuzzles.length - 1} title="Descendre" type="button" onClick={() => onPuzzleMove(trainingPuzzle['@id'], 'down')}>Bas</button><button aria-label={`Supprimer le puzzle ${trainingPuzzle.position + 1}`} className="wp-danger wp-puzzle-action" disabled={deletePuzzleIsPending} title="Supprimer" type="button" onClick={() => { const shouldDelete = window.confirm(`Supprimer le puzzle ${trainingPuzzle.position + 1} de ce training ?`); if (shouldDelete) { onPuzzleDelete(trainingPuzzle['@id']); } }}>Retirer</button></div>}</div>; })}</div></section></div><section className="wp-panel wp-history-panel"><div className="wp-panel-title"><p className="eyebrow">Cycles</p><h3>Historique des cycles</h3></div>{summaryIsLoading && <p className="wp-empty">Chargement du resume...</p>}{summaryIsError && <p className="alert error-alert">{summaryError}</p>}{!summaryIsLoading && !summaryIsError && cycleSummaries.length === 0 && <p className="wp-empty">Aucun cycle lance pour l'instant. Demarre un cycle quand ta liste de puzzles est prete.</p>}{cycleSummaries.length > 0 && <div className="wp-cycle-list">{cycleSummaries.map((summaryItem: TrainingCycleSummary) => <article className="wp-cycle-row" key={summaryItem.cycle['@id']}><div><strong>Cycle {summaryItem.cycle.number}</strong><span>{getCycleStatusLabel(summaryItem.cycle.status)}</span></div><div className="wp-cycle-row-progress"><div className="wp-progress"><span style={{ width: `${summaryItem.progressPercent}%` }} /></div><small>{summaryItem.solved} resolu(s), {summaryItem.failed} a revoir, {summaryItem.pending} restant(s)</small></div><div className="wp-cycle-row-meta"><span>{summaryItem.attemptCount} tentative(s)</span><span>{summaryItem.cycle.startedAt ? `Debut ${formatDateTime(summaryItem.cycle.startedAt)}` : 'Pas demarre'}</span>{summaryItem.cycle.completedAt && <span>Fin {formatDateTime(summaryItem.cycle.completedAt)}</span>}</div></article>)}</div>}</section><section className="wp-panel wp-history-panel"><div className="wp-panel-title"><p className="eyebrow">Historique</p><h3>Dernieres tentatives</h3></div>{summaryIsLoading && <p className="wp-empty">Chargement des tentatives...</p>}{summaryIsError && <p className="alert error-alert">{summaryError}</p>}{!summaryIsLoading && !summaryIsError && latestAttempts.length === 0 && <p className="wp-empty">Aucune tentative sauvegardee pour l'instant. Demarre un cycle puis resous un puzzle.</p>}{latestAttempts.length > 0 && <div className="wp-attempt-list">{latestAttempts.map((attempt: TrainingAttemptSummary) => <article className="wp-attempt-row" key={attempt['@id']}><div><strong>{attempt.successful ? 'Reussi' : 'A revoir'}</strong><span>{attempt.cycleNumber ? `Cycle ${attempt.cycleNumber}` : 'Cycle'}{' - '}{typeof attempt.trainingPuzzlePosition === 'number' ? `Puzzle ${attempt.trainingPuzzlePosition + 1}` : 'Puzzle'}</span></div><div className="wp-attempt-metrics"><span>{attempt.mistakesCount} erreur(s)</span><span>{formatDuration(attempt.durationMilliseconds)}</span><span>{formatDateTime(attempt.attemptedAt)}</span></div></article>)}</div>}</section></div>;
}

