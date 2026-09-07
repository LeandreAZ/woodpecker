import { ArrowLeft, CirclePlay } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type SetStateAction } from 'react';
import * as AppIcons from '../../../shared/icons/AppIcons';
import type { CyclePuzzle } from '../../trainings/types/training.types';
import { PuzzleSolver, type PuzzleSolverSnapshot } from '../components/PuzzleSolver';
import { SolverControls } from '../components/SolverControls';
import { SolverProgress } from '../components/SolverProgress';
import { SolverPuzzleList } from '../components/SolverPuzzleList';
import { SolverSummary } from '../components/SolverSummary';
import { attemptSessionsMatch, buildAttemptSession, buildSideSummary, buildStatusSummary, createInitialSnapshot, getActiveAttempt, getCompletedAttemptCount, getPuzzlePageSize, isFailed, isFrozen, solverSnapshotsMatch } from '../domain/solverViewModel';
import {
  getLatestPendingSolverAttemptForCyclePuzzle,
  registerSolverNavigationSnapshotHandler,
  removePendingSolverAttempt,
  upsertPendingSolverAttempt
} from '../services/solverPersistence';
import '../styles/solver.css';
import type { AttemptSession, SolverViewProps } from '../types/solverView.types';
import { formatCompactDate, formatDuration } from '../utils/solverFormatting';

const PROGRESS_SAVE_INTERVAL_MS = 10000;

export function SolverView({
  activeTrainingSessionIri,
  attemptError,
  attemptIsError,
  currentCycle,
  cyclePuzzles,
  cycleStats,
  currentCyclePuzzle,
  failedCyclePuzzleIris,
  hasActiveCycle,
  isTrainingSessionPending = false,
  onBackToDashboard,
  onBackToDetail,
  onPuzzleCompleted,
  onPuzzleFailed,
  onPuzzleFirstMistake,
  onPuzzleProgress,
  onPuzzleSelect,
  savedCyclePuzzleIris,
  selectedPuzzle,
  selectedTraining,
  selectedTrainingPuzzle,
  trainingPuzzles,
  userSettingsOverview,
}: SolverViewProps) {
  const [isPuzzleListOpen, setIsPuzzleListOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [puzzlePageSize, setPuzzlePageSize] = useState(() => getPuzzlePageSize(window.innerWidth));
  const [pagination, setPagination] = useState({ currentIndex: -1, pageSize: puzzlePageSize, page: 0 });
  const [solverSnapshot, setSolverSnapshot] = useState<PuzzleSolverSnapshot>(() => createInitialSnapshot(currentCyclePuzzle));
  const [attemptSession, setAttemptSession] = useState<AttemptSession | null>(null);
  const attemptSessionRef = useRef<AttemptSession | null>(null);
  const draftAttemptSessionsRef = useRef<Record<string, AttemptSession>>({});
  const previousPuzzleSelectionKeyRef = useRef('');
  const progressRef = useRef<{
    cyclePuzzle: CyclePuzzle | null;
    cyclePuzzleDurationMilliseconds: number;
    durationMilliseconds: number;
    frozen: boolean;
    hasActiveCycle: boolean;
    session: AttemptSession | null;
    solverSnapshot: PuzzleSolverSnapshot;
  } | null>(null);
  const onPuzzleProgressRef = useRef(onPuzzleProgress);
  const lastSavedSignatureRef = useRef('');

  const currentCyclePuzzleIri = currentCyclePuzzle?.['@id'] ?? null;
  const pendingAttemptSnapshot = getLatestPendingSolverAttemptForCyclePuzzle(selectedTraining?.['@id'], currentCyclePuzzleIri);
  const currentCyclePuzzleIsFailed = isFailed(currentCyclePuzzle, failedCyclePuzzleIris);
  const currentCyclePuzzleIsFrozen = isFrozen(currentCyclePuzzle, savedCyclePuzzleIris);
  const puzzleSelectionKey = [
    activeTrainingSessionIri ?? '',
    currentCyclePuzzle?.['@id'] ?? '',
  ].join('|');
  const currentCyclePuzzleSessionKey = [
    activeTrainingSessionIri ?? '',
    currentCyclePuzzle?.['@id'] ?? '',
    currentCyclePuzzle?.status ?? '',
    String(currentCyclePuzzle?.completedAttemptCount ?? ''),
    currentCyclePuzzle?.activeAttempt?.clientRequestId ?? '',
    String(currentCyclePuzzle?.activeAttempt?.attemptNumber ?? ''),
    currentCyclePuzzle?.activeAttempt?.status ?? '',
    currentCyclePuzzleIsFrozen ? '1' : '0',
    hasActiveCycle ? '1' : '0',
  ].join('|');
  const persistedAttemptCount = getCompletedAttemptCount(currentCyclePuzzle);
  const selectedPosition = selectedTrainingPuzzle ? selectedTrainingPuzzle.position + 1 : null;
  const currentIndex = selectedTrainingPuzzle ? trainingPuzzles.findIndex((item) => item['@id'] === selectedTrainingPuzzle['@id']) : -1;
  const previousPuzzle = currentIndex > 0 ? trainingPuzzles[currentIndex - 1] : null;
  const nextPuzzle = currentIndex >= 0 && currentIndex < trainingPuzzles.length - 1 ? trainingPuzzles[currentIndex + 1] : null;
  const cycleNumber = currentCycle?.number ?? 1;
  const handledPuzzleCount = cycleStats.total - cycleStats.pending;
  const progressLabel = `${handledPuzzleCount}/${cycleStats.total}`;
  const progressMetricLabel = `${handledPuzzleCount} / ${cycleStats.total}`;
  const progressRingStyle = { '--solver-progress': cycleStats.progressPercent } as CSSProperties;
  const cycleDateLabel = currentCycle?.startedAt
    ? `${formatCompactDate(currentCycle.startedAt)} - ${formatCompactDate(currentCycle.completedAt)}`
    : 'Dates indisponibles';
  const evaluationFailed = currentCyclePuzzleIsFailed || solverSnapshot.evaluationFailed;
  const resolved = currentCyclePuzzleIsFrozen || solverSnapshot.resolved;
  const pageCount = Math.max(1, Math.ceil(trainingPuzzles.length / puzzlePageSize));
  const selectionChanged = pagination.currentIndex !== currentIndex || pagination.pageSize !== puzzlePageSize;
  const puzzlePage = Math.min(selectionChanged ? Math.max(0, Math.floor(currentIndex / puzzlePageSize)) : pagination.page, pageCount - 1);
  if (selectionChanged || pagination.page !== puzzlePage) {
    setPagination({ currentIndex, pageSize: puzzlePageSize, page: puzzlePage });
  }
  function setPuzzlePage(value: SetStateAction<number>) {
    setPagination((current) => ({ currentIndex, pageSize: puzzlePageSize, page: typeof value === 'function' ? value(current.page) : value }));
  }
  const pageStartIndex = puzzlePage * puzzlePageSize;
  const visibleTrainingPuzzles = trainingPuzzles.slice(pageStartIndex, pageStartIndex + puzzlePageSize);
  const showPagination = trainingPuzzles.length > puzzlePageSize;
  const activeAttempt = getActiveAttempt(currentCyclePuzzle);
  const activeAttemptSession = attemptSession?.cyclePuzzleIri === currentCyclePuzzle?.['@id'] ? attemptSession : null;
  const mergedPersistedDurationMilliseconds = Math.max(currentCyclePuzzle?.durationMilliseconds ?? 0, pendingAttemptSnapshot?.cyclePuzzleDurationMilliseconds ?? 0);
  const mergedActiveAttemptDurationMilliseconds = Math.max(activeAttempt?.durationMilliseconds ?? 0, pendingAttemptSnapshot?.status === 'in_progress' ? pendingAttemptSnapshot.durationMilliseconds : 0);
  const completedDurationBase = Math.max(0, mergedPersistedDurationMilliseconds - mergedActiveAttemptDurationMilliseconds);
  const currentAttemptDurationMilliseconds = currentCyclePuzzleIsFrozen || !activeAttemptSession
    ? 0
    : activeAttemptSession.persistedDurationMilliseconds + Math.max(now - activeAttemptSession.startedAt, 0);
  const elapsedMilliseconds = currentCyclePuzzleIsFrozen ? mergedPersistedDurationMilliseconds : completedDurationBase + currentAttemptDurationMilliseconds;
  const elapsedLabel = formatDuration(elapsedMilliseconds);
  const isAttemptInProgress = !currentCyclePuzzleIsFrozen && Boolean(
    activeAttemptSession
    || currentCyclePuzzle?.status === 'in_progress'
    || pendingAttemptSnapshot?.status === 'in_progress',
  );
  const statusSummary = buildStatusSummary(evaluationFailed, currentCyclePuzzleIsFrozen, resolved, isAttemptInProgress);
  const sideSummary = buildSideSummary(selectedPuzzle?.fen);
  const boardSettings = userSettingsOverview?.board;
  const solverPreferences = userSettingsOverview?.solverPreferences;
  const solverPreferenceKey = [
    selectedTrainingPuzzle?.['@id'] ?? 'no-puzzle',
    solverPreferences?.animateMoves ?? true,
    solverPreferences?.showCoordinates ?? true,
    solverPreferences?.showLegalMoves ?? true,
    solverPreferences?.showRightClickTargets ?? true,
    boardSettings?.lightSquareColor ?? '',
    boardSettings?.darkSquareColor ?? '',
  ].join(':');
  const hasRunnableAttempt = Boolean(currentCyclePuzzle && !currentCyclePuzzleIsFrozen && activeTrainingSessionIri && hasActiveCycle);

  function setCurrentAttemptSession(value: AttemptSession | null) {
    if (attemptSessionsMatch(attemptSessionRef.current, value)) {
      return;
    }

    attemptSessionRef.current = value;
    setAttemptSession((current) => (attemptSessionsMatch(current, value) ? current : value));
  }

  const setSolverSnapshotSafely = useCallback((nextValue: PuzzleSolverSnapshot | ((current: PuzzleSolverSnapshot) => PuzzleSolverSnapshot)) => {
    setSolverSnapshot((current) => {
      const nextSnapshot = typeof nextValue === 'function'
        ? (nextValue as (current: PuzzleSolverSnapshot) => PuzzleSolverSnapshot)(current)
        : nextValue;

      return solverSnapshotsMatch(current, nextSnapshot) ? current : nextSnapshot;
    });
  }, []);

  useEffect(() => {
    onPuzzleProgressRef.current = onPuzzleProgress;
  }, [onPuzzleProgress]);

  useEffect(() => {
    const currentDraftAttemptSession = draftAttemptSessionsRef.current[puzzleSelectionKey] ?? null;
    const currentAttemptSession = attemptSessionRef.current?.cyclePuzzleIri === currentCyclePuzzle?.['@id']
      ? attemptSessionRef.current
      : currentDraftAttemptSession;
    const puzzleSelectionChanged = previousPuzzleSelectionKeyRef.current !== puzzleSelectionKey;
    const reusableAttemptSession = puzzleSelectionChanged ? null : currentAttemptSession;
    const nextAttemptSession = hasRunnableAttempt
      ? buildAttemptSession(currentCyclePuzzle!, activeTrainingSessionIri!, pendingAttemptSnapshot, reusableAttemptSession)
      : null;
    const attemptSessionChanged = !attemptSessionsMatch(attemptSessionRef.current, nextAttemptSession);

    previousPuzzleSelectionKeyRef.current = puzzleSelectionKey;

    if (nextAttemptSession) {
      draftAttemptSessionsRef.current[puzzleSelectionKey] = nextAttemptSession;
    } else {
      delete draftAttemptSessionsRef.current[puzzleSelectionKey];
    }

    if (attemptSessionChanged) {
      setCurrentAttemptSession(nextAttemptSession);
    }

    if (attemptSessionChanged || puzzleSelectionChanged) {
      setNow(Date.now());
      setIsPuzzleListOpen(false);
      setSolverSnapshotSafely(createInitialSnapshot(currentCyclePuzzle));
      lastSavedSignatureRef.current = '';
    }
  }, [currentCyclePuzzleSessionKey, hasRunnableAttempt, puzzleSelectionKey, setSolverSnapshotSafely]);

  useEffect(() => {
    if (currentCyclePuzzleIsFrozen || !activeAttemptSession) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeAttemptSession?.clientRequestId, currentCyclePuzzleIsFrozen, currentCyclePuzzle?.['@id']]);

  useEffect(() => {
    const handleResize = () => setPuzzlePageSize(getPuzzlePageSize(window.innerWidth));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    progressRef.current = {
      cyclePuzzle: currentCyclePuzzle,
      cyclePuzzleDurationMilliseconds: elapsedMilliseconds,
      durationMilliseconds: currentAttemptDurationMilliseconds,
      frozen: currentCyclePuzzleIsFrozen,
      hasActiveCycle,
      session: activeAttemptSession,
      solverSnapshot,
    };
  }, [activeAttemptSession, currentAttemptDurationMilliseconds, currentCyclePuzzle, currentCyclePuzzleIsFrozen, elapsedMilliseconds, hasActiveCycle, solverSnapshot]);

  useEffect(() => {
    if (!selectedTraining || !activeAttemptSession || !currentCyclePuzzle || currentCyclePuzzleIsFrozen) return;
    upsertPendingSolverAttempt({
      attemptNumber: activeAttemptSession.attemptNumber,
      clientRequestId: activeAttemptSession.clientRequestId,
      cyclePuzzleDurationMilliseconds: elapsedMilliseconds,
      cyclePuzzleIri: currentCyclePuzzle['@id'],
      durationMilliseconds: currentAttemptDurationMilliseconds,
      mistakesCount: solverSnapshot.mistakesCount,
      playedMoves: solverSnapshot.playedMoves,
      status: resolved ? (evaluationFailed ? 'failed' : 'solved') : 'in_progress',
      trainingIri: selectedTraining['@id'],
      trainingSession: activeAttemptSession.trainingSession,
    });
  }, [activeAttemptSession, currentAttemptDurationMilliseconds, currentCyclePuzzle, currentCyclePuzzleIsFrozen, elapsedMilliseconds, evaluationFailed, resolved, selectedTraining, solverSnapshot.mistakesCount, solverSnapshot.playedMoves]);

  async function persistCurrentProgress(force = false, keepalive = false) {
    const currentProgress = progressRef.current;
    const progressHandler = onPuzzleProgressRef.current;
    if (!currentProgress || !currentProgress.cyclePuzzle || !currentProgress.hasActiveCycle || currentProgress.frozen || !progressHandler || !currentProgress.session) {
      return false;
    }

    const liveAttemptDurationMilliseconds = currentProgress.session.persistedDurationMilliseconds + Math.max(Date.now() - currentProgress.session.startedAt, 0);
    const completedDurationMilliseconds = Math.max(0, currentProgress.cyclePuzzleDurationMilliseconds - currentProgress.durationMilliseconds);
    const liveCyclePuzzleDurationMilliseconds = completedDurationMilliseconds + liveAttemptDurationMilliseconds;
    const nextStatus = currentProgress.solverSnapshot.resolved
      ? currentProgress.solverSnapshot.evaluationFailed
        ? 'failed'
        : 'solved'
      : 'in_progress';

    if (selectedTraining) {
      upsertPendingSolverAttempt({
        attemptNumber: currentProgress.session.attemptNumber,
        clientRequestId: currentProgress.session.clientRequestId,
        cyclePuzzleDurationMilliseconds: liveCyclePuzzleDurationMilliseconds,
        cyclePuzzleIri: currentProgress.cyclePuzzle['@id'],
        durationMilliseconds: liveAttemptDurationMilliseconds,
        mistakesCount: currentProgress.solverSnapshot.mistakesCount,
        playedMoves: currentProgress.solverSnapshot.playedMoves,
        status: nextStatus,
        trainingIri: selectedTraining['@id'],
        trainingSession: currentProgress.session.trainingSession,
      });
    }

    const durationSignature = force
      ? liveCyclePuzzleDurationMilliseconds
      : Math.floor(liveCyclePuzzleDurationMilliseconds / PROGRESS_SAVE_INTERVAL_MS) * PROGRESS_SAVE_INTERVAL_MS;
    const signature = [
      currentProgress.cyclePuzzle['@id'],
      currentProgress.session.clientRequestId,
      currentProgress.session.attemptNumber,
      durationSignature,
      currentProgress.solverSnapshot.playedMoves.length,
    ].join('|');
    if (!force && lastSavedSignatureRef.current === signature) return false;
    lastSavedSignatureRef.current = signature;
    await Promise.resolve(progressHandler({
      attemptNumber: currentProgress.session.attemptNumber,
      clientRequestId: currentProgress.session.clientRequestId,
      cyclePuzzle: currentProgress.cyclePuzzle,
      cyclePuzzleDurationMilliseconds: liveCyclePuzzleDurationMilliseconds,
      durationMilliseconds: liveAttemptDurationMilliseconds,
      keepalive,
      mistakesCount: currentProgress.solverSnapshot.mistakesCount,
      playedMoves: currentProgress.solverSnapshot.playedMoves,
      trainingSession: currentProgress.session.trainingSession,
    }));
    return true;
  }

  useEffect(() => {
    if (!activeAttemptSession || !currentCyclePuzzle || currentCyclePuzzleIsFrozen || !hasActiveCycle || !onPuzzleProgress) return;
    void persistCurrentProgress(true);
  }, [activeAttemptSession?.clientRequestId, currentCyclePuzzle?.['@id'], currentCyclePuzzleIsFrozen, hasActiveCycle]);

  useEffect(() => {
    if (!activeAttemptSession || !currentCyclePuzzle || currentCyclePuzzleIsFrozen || !hasActiveCycle || !onPuzzleProgress) return;
    const interval = window.setInterval(() => { void persistCurrentProgress(false); }, PROGRESS_SAVE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [activeAttemptSession?.clientRequestId, currentCyclePuzzle?.['@id'], currentCyclePuzzleIsFrozen, hasActiveCycle]);


  useEffect(() => registerSolverNavigationSnapshotHandler(() => {
    void persistCurrentProgress(true, true);
  }), [activeAttemptSession?.clientRequestId, currentCyclePuzzle?.['@id']]);

  useEffect(() => {
    const persistForExit = () => { void persistCurrentProgress(true, true); };
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') persistForExit(); };
    window.addEventListener('pagehide', persistForExit);
    window.addEventListener('beforeunload', persistForExit);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', persistForExit);
      window.removeEventListener('beforeunload', persistForExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeAttemptSession?.clientRequestId, currentCyclePuzzle?.['@id']]);

  function switchPuzzle(trainingPuzzleIri: string) {
    void persistCurrentProgress(true, true);
    setIsPuzzleListOpen(false);
    onPuzzleSelect(trainingPuzzleIri);
  }

  if (!selectedTraining) {
    return <div className="wp-page solver-page"><div className="wp-empty-card"><h3>Aucun entraînement ouvert</h3><p>Retournez au tableau de bord pour choisir un entraînement, puis relancez le solveur depuis sa page détail.</p><button className="wp-primary" type="button" onClick={onBackToDashboard}>Ouvrir le tableau de bord</button></div></div>;
  }
  if (trainingPuzzles.length === 0) {
    return <div className="wp-page solver-page"><div className="wp-empty-card"><h3>Ce training ne contient pas encore de puzzle</h3><p>Ajoutez des puzzles manuellement ou importez un CSV avant d’ouvrir une vraie session de résolution.</p><button className="wp-primary" type="button" onClick={onBackToDetail}>Retour au détail du training</button></div></div>;
  }

  if (currentCyclePuzzle && !currentCyclePuzzleIsFrozen && isTrainingSessionPending) {
    return <div className="wp-page solver-page"><div className="wp-empty-card"><h3>Préparation de la session</h3><p>Le solver restaure la session active avant de démarrer le chrono et la tentative en cours.</p></div></div>;
  }

  if (selectedTrainingPuzzle && (!currentCyclePuzzle || !hasActiveCycle || !activeTrainingSessionIri)) {
    return (
      <div className="wp-page solver-page solver-page--empty">
        <div className="wp-empty-card solver-empty-card">
          <span className="solver-empty-card__icon"><CirclePlay aria-hidden="true" size={48} strokeWidth={1.7} /></span>
          <h3>Aucun cycle démarré</h3>
          <p>Le solveur ne peut donc pas être ouvert.</p>
          <p>Démarrez ou reprenez un cycle depuis le détail de l'entraînement pour accéder au solveur.</p>
          <button className="wp-primary" type="button" onClick={onBackToDetail}><ArrowLeft aria-hidden="true" size={20} />Retour au détail du training</button>
        </div>
      </div>
    );
  }

  return (
    <div className="wp-page solver-page solver-page-v2">
      <SolverProgress progressRingStyle={progressRingStyle} progressLabel={progressLabel} cycleNumber={cycleNumber} cycleDateLabel={cycleDateLabel} progressMetricLabel={progressMetricLabel} elapsedLabel={elapsedLabel} />
      <div className="wp-solver-layout-v2">
        <SolverPuzzleList isPuzzleListOpen={isPuzzleListOpen} setIsPuzzleListOpen={setIsPuzzleListOpen} selectedPosition={selectedPosition} trainingPuzzles={trainingPuzzles} visibleTrainingPuzzles={visibleTrainingPuzzles} cyclePuzzles={cyclePuzzles} selectedTrainingPuzzle={selectedTrainingPuzzle} switchPuzzle={switchPuzzle} showPagination={showPagination} puzzlePage={puzzlePage} pageCount={pageCount} setPuzzlePage={setPuzzlePage} />
        <section className="wp-panel wp-solver-board-panel-v2">
          <div className="wp-solver-board-panel-v2__mobile-head"><strong>{selectedPosition ? `Puzzle ${selectedPosition} / ${trainingPuzzles.length}` : 'Puzzle'}</strong><button className="wp-solver-list-v2__toggle" type="button" onClick={() => setIsPuzzleListOpen((current) => !current)}><AppIcons.BarsIcon /></button></div>
          <div className="wp-solver-board-panel-v2__alerts">{attemptIsError ? <p className="alert error-alert">{attemptError}</p> : null}</div>
          <div className="wp-solver-stage-v2">
            <div className="wp-solver-board-panel-v2__body">
              {selectedTrainingPuzzle && selectedPuzzle ? <PuzzleSolver key={solverPreferenceKey} animateMoves={solverPreferences?.animateMoves ?? true} darkSquareColor={boardSettings?.darkSquareColor} fen={selectedPuzzle.fen} initialEvaluationFailed={currentCyclePuzzleIsFailed} lightSquareColor={boardSettings?.lightSquareColor} onCompleted={async (result) => {
                const activeSession = attemptSessionRef.current;
                if (!currentCyclePuzzle || !activeSession) return;
                const payload = { attemptNumber: activeSession.attemptNumber, clientRequestId: activeSession.clientRequestId, cyclePuzzle: currentCyclePuzzle, cyclePuzzleDurationMilliseconds: elapsedMilliseconds, durationMilliseconds: currentAttemptDurationMilliseconds, mistakesCount: result.mistakesCount, playedMoves: result.playedMoves, trainingSession: activeSession.trainingSession };
                await onPuzzleCompleted({ ...result, ...payload });
                // Query refresh may already have started the next attempt while saving.
                const savedSessionKey = activeSession.trainingSession + '|' + activeSession.cyclePuzzleIri;
                if (draftAttemptSessionsRef.current[savedSessionKey]?.clientRequestId === activeSession.clientRequestId) {
                  delete draftAttemptSessionsRef.current[savedSessionKey];
                }
                if (attemptSessionRef.current?.clientRequestId === activeSession.clientRequestId) {
                  setCurrentAttemptSession(null);
                }
                removePendingSolverAttempt(activeSession.clientRequestId);
              }} onFailed={async (result) => {
                const activeSession = attemptSessionRef.current;
                if (!currentCyclePuzzle || !activeSession) return;
                const payload = { attemptNumber: activeSession.attemptNumber, clientRequestId: activeSession.clientRequestId, cyclePuzzle: currentCyclePuzzle, cyclePuzzleDurationMilliseconds: elapsedMilliseconds, durationMilliseconds: currentAttemptDurationMilliseconds, mistakesCount: result.mistakesCount, playedMoves: result.playedMoves, trainingSession: activeSession.trainingSession };
                await onPuzzleFailed({ ...result, ...payload });
                // Query refresh may already have started the next attempt while saving.
                const savedSessionKey = activeSession.trainingSession + '|' + activeSession.cyclePuzzleIri;
                if (draftAttemptSessionsRef.current[savedSessionKey]?.clientRequestId === activeSession.clientRequestId) {
                  delete draftAttemptSessionsRef.current[savedSessionKey];
                }
                if (attemptSessionRef.current?.clientRequestId === activeSession.clientRequestId) {
                  setCurrentAttemptSession(null);
                }
                lastSavedSignatureRef.current = '';
              }} onFirstMistake={(result) => { setSolverSnapshotSafely((current) => ({ ...current, evaluationFailed: true, feedback: { kind: 'error', message: 'Puzzle raté. Continuez à chercher mais les tentatives seront encore enregistrées.' } })); onPuzzleFirstMistake?.(result); }} onStateChange={setSolverSnapshotSafely} showCoordinates={solverPreferences?.showCoordinates ?? true} showLegalMoves={solverPreferences?.showLegalMoves ?? true} showRightClickTargets={solverPreferences?.showRightClickTargets ?? true} solution={selectedPuzzle.solution} /> : <p className="wp-empty">Chargement du puzzle sélectionné...</p>}
            </div>
            <SolverSummary statusSummary={statusSummary} persistedAttemptCount={persistedAttemptCount} sideSummary={sideSummary} />
          </div>
          <SolverControls previousPuzzle={previousPuzzle} nextPuzzle={nextPuzzle} switchPuzzle={switchPuzzle} />
        </section>
      </div>
    </div>
  );
}

export default SolverView;
