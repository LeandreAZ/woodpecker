import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChessPawn, ChevronLeft, ChevronRight } from 'lucide-react';
import * as AppIcons from '../../shared/AppIcons';
import { PuzzleSolver, type PuzzleCompletionResult, type PuzzleSolverSnapshot } from './PuzzleSolver';
import {
  createSolverAttemptClientRequestId,
  getLatestPendingSolverAttemptForCyclePuzzle,
  registerSolverNavigationSnapshotHandler,
  removePendingSolverAttempt,
  upsertPendingSolverAttempt,
} from './solverPersistence';
import { getSideToMoveMeta } from './chessboardPreferences';
import type { Cycle, CyclePuzzle, CycleStats, Puzzle, Training, TrainingPuzzle, TrainingSummary, UserSettingsOverview } from './trainingsTypes';
import './solver.css';

type AttemptSyncPayload = {
  attemptNumber: number;
  clientRequestId: string;
  cyclePuzzle: CyclePuzzle;
  cyclePuzzleDurationMilliseconds: number;
  durationMilliseconds: number;
  keepalive?: boolean;
  mistakesCount: number;
  playedMoves: string[];
  trainingSession: string;
};

type SolverViewProps = {
  activeTrainingSessionIri?: string | null;
  attemptError?: string;
  attemptIsError: boolean;
  attemptIsPending: boolean;
  currentCycle?: Cycle | null;
  cycleIsFinished: boolean;
  cyclePuzzles: CyclePuzzle[];
  cycleStats: CycleStats;
  currentCyclePuzzle: CyclePuzzle | null;
  failedCyclePuzzleIris: Set<string>;
  hasActiveCycle: boolean;
  isTrainingSessionPending?: boolean;
  onBackToDashboard: () => void;
  onBackToDetail: () => void;
  onPuzzleCompleted: (result: PuzzleCompletionResult & AttemptSyncPayload) => void | Promise<void>;
  onPuzzleFailed: (result: PuzzleCompletionResult & AttemptSyncPayload) => void | Promise<void>;
  onPuzzleFirstMistake?: (result: PuzzleCompletionResult) => void;
  onPuzzleProgress?: (value: AttemptSyncPayload) => void | Promise<unknown>;
  onPuzzleSelect: (trainingPuzzleIri: string) => void;
  savedCyclePuzzleIris: Set<string>;
  selectedPuzzle?: Puzzle;
  selectedTraining: Training | null;
  selectedTrainingPuzzle: TrainingPuzzle | null;
  summary: TrainingSummary | null;
  trainingPuzzles: TrainingPuzzle[];
  userSettingsOverview?: UserSettingsOverview | null;
};

type PuzzleListTone = 'current' | 'failed' | 'pending' | 'solved';

type AttemptSession = {
  attemptNumber: number;
  clientRequestId: string;
  cyclePuzzleIri: string;
  persistedDurationMilliseconds: number;
  startedAt: number;
  trainingSession: string;
};

type SolverStatusSummary = {
  accent: 'danger' | 'info' | 'success';
  description: string;
  label: string;
};

type SolverSideSummary = {
  description: string;
  label: string;
};

const INITIAL_SOLVER_SNAPSHOT: PuzzleSolverSnapshot = {
  completed: false,
  evaluationFailed: false,
  feedback: { kind: 'info', message: 'Trouvez le meilleur coup.' },
  mistakesCount: 0,
  playedMoves: [],
  resolved: false,
};

const PROGRESS_SAVE_INTERVAL_MS = 10000;

function formatCompactDate(value?: string | null) {
  if (!value) return 'Dates indisponibles';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dates indisponibles';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getCompletedAttemptCount(cyclePuzzle?: CyclePuzzle | null) {
  if (!cyclePuzzle) return 0;
  if (typeof cyclePuzzle.completedAttemptCount === 'number') return cyclePuzzle.completedAttemptCount;
  return cyclePuzzle.attempts?.filter((attempt) => attempt.status !== 'in_progress').length ?? 0;
}

function getHasSolvedAttempt(cyclePuzzle?: CyclePuzzle | null) {
  if (!cyclePuzzle) return false;
  if (typeof cyclePuzzle.hasSolvedAttempt === 'boolean') return cyclePuzzle.hasSolvedAttempt;
  return cyclePuzzle.attempts?.some((attempt) => attempt.status === 'solved') ?? false;
}

function getActiveAttempt(cyclePuzzle?: CyclePuzzle | null) {
  if (!cyclePuzzle) return null;
  return cyclePuzzle.activeAttempt ?? cyclePuzzle.attempts?.find((attempt) => attempt.status === 'in_progress') ?? null;
}

function isSolved(cyclePuzzle?: CyclePuzzle | null, saved?: Set<string>) {
  return Boolean(cyclePuzzle && (cyclePuzzle.status === 'solved' || saved?.has(cyclePuzzle['@id'])));
}

function isFailed(cyclePuzzle?: CyclePuzzle | null, failed?: Set<string>) {
  return Boolean(cyclePuzzle && (cyclePuzzle.status === 'failed' || failed?.has(cyclePuzzle['@id'])));
}

function isFrozen(cyclePuzzle?: CyclePuzzle | null, saved?: Set<string>) {
  if (!cyclePuzzle) return false;
  return cyclePuzzle.status === 'solved'
    || (cyclePuzzle.status === 'failed' && getHasSolvedAttempt(cyclePuzzle))
    || Boolean(saved?.has(cyclePuzzle['@id']));
}

function getPuzzleListStatus(cyclePuzzle?: CyclePuzzle | null) {
  if (!cyclePuzzle || cyclePuzzle.status === 'pending') return { label: 'Non tenté', tone: 'pending' as PuzzleListTone };
  if (cyclePuzzle.status === 'in_progress') return { label: 'En cours', tone: 'current' as PuzzleListTone };
  if (cyclePuzzle.status === 'solved') return { label: 'Résolu', tone: 'solved' as PuzzleListTone };
  return { label: 'Raté', tone: 'failed' as PuzzleListTone };
}

function getAttemptSummaryLabel(attemptCount: number) {
  if (attemptCount <= 0) return 'Aucune tentative enregistrée pour ce puzzle.';
  if (attemptCount === 1) return '1 tentative enregistrée pour ce puzzle.';
  return `${attemptCount} tentatives enregistrées pour ce puzzle.`;
}

function getPuzzlePageSize(width: number) {
  return width >= 1024 ? 10 : 5;
}

function getRingValueClassName(value: string) {
  if (value.length >= 6) return 'wp-solver-topbar-v2__ring-value is-xcompact';
  if (value.length >= 4) return 'wp-solver-topbar-v2__ring-value is-compact';
  return 'wp-solver-topbar-v2__ring-value';
}

function createInitialSnapshot(cyclePuzzle: CyclePuzzle | null): PuzzleSolverSnapshot {
  if (!cyclePuzzle) return INITIAL_SOLVER_SNAPSHOT;
  if (cyclePuzzle.status === 'solved') {
    return {
      ...INITIAL_SOLVER_SNAPSHOT,
      completed: true,
      feedback: { kind: 'success', message: 'Puzzle déjà validé. Vous pouvez le rejouer en révision sans impact.' },
      resolved: true,
    };
  }
  if (cyclePuzzle.status === 'failed' && getHasSolvedAttempt(cyclePuzzle)) {
    return {
      ...INITIAL_SOLVER_SNAPSHOT,
      completed: true,
      evaluationFailed: true,
      feedback: { kind: 'info', message: 'Puzzle déjà terminé. Vous pouvez le rejouer en révision sans impact.' },
      resolved: true,
    };
  }
  if (cyclePuzzle.status === 'failed') {
    return {
      ...INITIAL_SOLVER_SNAPSHOT,
      evaluationFailed: true,
      feedback: { kind: 'info', message: 'Puzzle raté. Continuez à chercher mais les tentatives seront encore enregistrées.' },
    };
  }
  if (cyclePuzzle.status === 'in_progress') {
    return { ...INITIAL_SOLVER_SNAPSHOT, feedback: { kind: 'info', message: 'Reprise du puzzle en cours.' } };
  }
  return INITIAL_SOLVER_SNAPSHOT;
}

function buildStatusSummary(evaluationFailed: boolean, frozen: boolean, resolved: boolean, inProgress: boolean): SolverStatusSummary {
  if (resolved && evaluationFailed) return { accent: 'danger', description: 'Trouvez le meilleur coup.', label: 'Raté' };
  if (resolved) return { accent: 'success', description: 'Vous avez trouvé le meilleur coup.', label: frozen ? 'Réussi' : 'Trouvé' };
  if (evaluationFailed) return { accent: 'danger', description: 'Trouvez le meilleur coup.', label: 'Raté' };
  if (inProgress) return { accent: 'info', description: 'Trouvez le meilleur coup !', label: 'En cours' };
  return { accent: 'info', description: 'Trouvez le meilleur coup.', label: 'À vous de jouer' };
}

function buildSideSummary(fen?: string | null): SolverSideSummary {
  const side = getSideToMoveMeta(fen);
  return { label: side.label, description: side.description };
}

function buildAttemptSession(
  cyclePuzzle: CyclePuzzle,
  trainingSession: string,
  pending: ReturnType<typeof getLatestPendingSolverAttemptForCyclePuzzle>,
  currentSession: AttemptSession | null,
): AttemptSession | null {
  const activeAttempt = getActiveAttempt(cyclePuzzle);
  const completedAttemptCount = getCompletedAttemptCount(cyclePuzzle);
  const pendingIsReusable = pending?.status === 'in_progress'
    && pending.attemptNumber > completedAttemptCount
    && cyclePuzzle.status !== 'failed';
  const reusableCurrentSession = currentSession?.cyclePuzzleIri === cyclePuzzle['@id']
    && currentSession.trainingSession === trainingSession
      ? currentSession
      : null;

  function createSession(attemptNumber: number, clientRequestId: string, persistedDurationMilliseconds: number) {
    const sameIdentity = reusableCurrentSession
      && reusableCurrentSession.attemptNumber === attemptNumber
      && reusableCurrentSession.clientRequestId === clientRequestId;

    if (sameIdentity && reusableCurrentSession.persistedDurationMilliseconds === persistedDurationMilliseconds) {
      return reusableCurrentSession;
    }

    return {
      attemptNumber,
      clientRequestId,
      cyclePuzzleIri: cyclePuzzle['@id'],
      persistedDurationMilliseconds,
      startedAt: sameIdentity ? reusableCurrentSession.startedAt : Date.now(),
      trainingSession,
    };
  }

  if (activeAttempt?.status === 'in_progress') {
    return createSession(
      activeAttempt.attemptNumber,
      activeAttempt.clientRequestId ?? reusableCurrentSession?.clientRequestId ?? pending?.clientRequestId ?? createSolverAttemptClientRequestId(),
      Math.max(activeAttempt.durationMilliseconds ?? 0, pendingIsReusable ? pending.durationMilliseconds : 0),
    );
  }

  if (pendingIsReusable) {
    return createSession(pending.attemptNumber, pending.clientRequestId, pending.durationMilliseconds);
  }

  if (reusableCurrentSession && reusableCurrentSession.attemptNumber === completedAttemptCount + 1) {
    return reusableCurrentSession;
  }

  return createSession(
    completedAttemptCount + 1,
    reusableCurrentSession?.clientRequestId ?? createSolverAttemptClientRequestId(),
    0,
  );
}

function attemptSessionsMatch(left: AttemptSession | null, right: AttemptSession | null) {
  if (!left || !right) {
    return left === right;
  }

  return left.attemptNumber === right.attemptNumber
    && left.clientRequestId === right.clientRequestId
    && left.cyclePuzzleIri === right.cyclePuzzleIri
    && left.trainingSession === right.trainingSession;
}

function solverSnapshotsMatch(left: PuzzleSolverSnapshot, right: PuzzleSolverSnapshot) {
  return left.completed === right.completed
    && left.evaluationFailed === right.evaluationFailed
    && left.feedback.kind === right.feedback.kind
    && left.feedback.message === right.feedback.message
    && left.mistakesCount === right.mistakesCount
    && left.resolved === right.resolved
    && left.playedMoves.length === right.playedMoves.length
    && left.playedMoves.every((move, index) => move === right.playedMoves[index]);
}

export function SolverView({
  activeTrainingSessionIri,
  attemptError,
  attemptIsError,
  attemptIsPending,
  currentCycle,
  cycleIsFinished: _cycleIsFinished,
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
  summary: _summary,
  trainingPuzzles,
  userSettingsOverview,
}: SolverViewProps) {
  const [isPuzzleListOpen, setIsPuzzleListOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [puzzlePageSize, setPuzzlePageSize] = useState(() => getPuzzlePageSize(window.innerWidth));
  const [puzzlePage, setPuzzlePage] = useState(0);
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
    if (currentIndex < 0) {
      setPuzzlePage(0);
      return;
    }
    setPuzzlePage(Math.floor(currentIndex / puzzlePageSize));
  }, [currentIndex, puzzlePageSize]);

  useEffect(() => {
    setPuzzlePage((current) => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

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
    return <div className="wp-page solver-page"><div className="wp-empty-card"><h3>Aucun cycle actif exploitable</h3><p>Ce puzzle est affiché sans session de solver réellement active. Revenez au détail de l’entraînement puis démarrez ou reprenez un cycle avant d’ouvrir ce puzzle.</p><button className="wp-primary" type="button" onClick={onBackToDetail}>Retour au détail du training</button></div></div>;
  }

  return (
    <div className="wp-page solver-page solver-page-v2">
      <section className="wp-panel wp-solver-topbar-v2">
        <div className="wp-solver-topbar-v2__cycle">
          <div className="wp-solver-topbar-v2__ring" style={progressRingStyle}><div><strong className={getRingValueClassName(progressLabel)}>{progressLabel}</strong></div></div>
          <div className="wp-solver-topbar-v2__cycle-copy"><div><strong>{`Cycle ${cycleNumber}`}</strong><p>{cycleDateLabel}</p></div></div>
        </div>
        <div className="wp-solver-topbar-v2__metrics">
          <div className="wp-solver-topbar-v2__metric"><span className="wp-solver-topbar-v2__metric-icon tone-blue"><AppIcons.TrendUpIcon /></span><div><strong>Progression du cycle</strong><p className="wp-solver-topbar-v2__metric-value is-progress">{progressMetricLabel}</p></div></div>
          <div className="wp-solver-topbar-v2__metric"><span className="wp-solver-topbar-v2__metric-icon tone-blue"><AppIcons.HistoryIcon /></span><div><strong>Durée du puzzle</strong><p className="wp-solver-topbar-v2__metric-value is-progress">{elapsedLabel}</p></div></div>
        </div>
      </section>
      <div className="wp-solver-layout-v2">
        <aside className={`wp-panel wp-solver-list-v2${isPuzzleListOpen ? ' is-open' : ''}`}>
          <div className="wp-solver-list-v2__header"><div><h3>{selectedPosition ? `Puzzle ${selectedPosition} / ${trainingPuzzles.length}` : 'Puzzle'}</h3></div><button className="wp-solver-list-v2__toggle wp-solver-list-v2__toggle--mobile" type="button" aria-label="Afficher la liste des puzzles" onClick={() => setIsPuzzleListOpen((current) => !current)}><AppIcons.BarsIcon /></button></div>
          <div className="wp-solver-list-v2__body">
            {visibleTrainingPuzzles.map((trainingPuzzle) => {
              const cyclePuzzle = cyclePuzzles.find((item) => item.trainingPuzzle === trainingPuzzle['@id']);
              const status = getPuzzleListStatus(cyclePuzzle);
              const isSelected = trainingPuzzle['@id'] === selectedTrainingPuzzle?.['@id'];
              const className = ['wp-solver-list-v2__row', isSelected ? 'is-active' : '', status.tone === 'solved' ? 'is-solved' : '', status.tone === 'failed' ? 'is-failed' : ''].filter(Boolean).join(' ');
              return <button className={className} key={trainingPuzzle['@id']} type="button" onClick={() => switchPuzzle(trainingPuzzle['@id'])}><span className={`wp-solver-list-v2__index tone-${status.tone}`} aria-hidden="true" /><span className="wp-solver-list-v2__position">{trainingPuzzle.position + 1}</span><span className="wp-solver-list-v2__status"><strong>{status.label}</strong></span></button>;
            })}
          </div>
          {showPagination ? <div className="wp-solver-list-v2__pager"><button className="wp-solver-list-v2__pager-button" disabled={puzzlePage === 0} type="button" onClick={() => setPuzzlePage((current) => Math.max(0, current - 1))}><ChevronLeft aria-hidden="true" size={18} strokeWidth={2} /><span>Précédent</span></button><button className="wp-solver-list-v2__pager-button" disabled={puzzlePage >= pageCount - 1} type="button" onClick={() => setPuzzlePage((current) => Math.min(pageCount - 1, current + 1))}><span>Suivant</span><ChevronRight aria-hidden="true" size={18} strokeWidth={2} /></button></div> : null}
        </aside>
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
                delete draftAttemptSessionsRef.current[activeSession.trainingSession + '|' + activeSession.cyclePuzzleIri];
                setCurrentAttemptSession(null);
                removePendingSolverAttempt(activeSession.clientRequestId);
              }} onFailed={async (result) => {
                const activeSession = attemptSessionRef.current;
                if (!currentCyclePuzzle || !activeSession) return;
                const payload = { attemptNumber: activeSession.attemptNumber, clientRequestId: activeSession.clientRequestId, cyclePuzzle: currentCyclePuzzle, cyclePuzzleDurationMilliseconds: elapsedMilliseconds, durationMilliseconds: currentAttemptDurationMilliseconds, mistakesCount: result.mistakesCount, playedMoves: result.playedMoves, trainingSession: activeSession.trainingSession };
                await onPuzzleFailed({ ...result, ...payload });
                delete draftAttemptSessionsRef.current[activeSession.trainingSession + '|' + activeSession.cyclePuzzleIri];
                setCurrentAttemptSession(null);
                lastSavedSignatureRef.current = '';
              }} onFirstMistake={(result) => { setSolverSnapshotSafely((current) => ({ ...current, evaluationFailed: true, feedback: { kind: 'error', message: 'Puzzle raté. Continuez à chercher mais les tentatives seront encore enregistrées.' } })); onPuzzleFirstMistake?.(result); }} onStateChange={setSolverSnapshotSafely} showCoordinates={solverPreferences?.showCoordinates ?? true} showLegalMoves={solverPreferences?.showLegalMoves ?? true} showRightClickTargets={solverPreferences?.showRightClickTargets ?? true} solution={selectedPuzzle.solution} /> : <p className="wp-empty">Chargement du puzzle sélectionné...</p>}
            </div>
            <div className="wp-solver-summary-v2">
              <div className={`wp-solver-summary-v2__item is-${statusSummary.accent}`}><div className="wp-solver-summary-v2__head"><span className="wp-solver-summary-v2__icon">{statusSummary.accent === 'success' ? <AppIcons.CheckCircleIcon /> : statusSummary.accent === 'danger' ? <AppIcons.AlertIcon /> : <AppIcons.TargetIcon />}</span><span className="wp-solver-summary-v2__label">Résultat</span></div><div className="wp-solver-summary-v2__content"><strong>{statusSummary.label}</strong><p>{statusSummary.description}</p></div></div>
              <div className="wp-solver-summary-v2__item is-accent-blue"><div className="wp-solver-summary-v2__head"><span className="wp-solver-summary-v2__icon"><AppIcons.HistoryIcon /></span><span className="wp-solver-summary-v2__label">Tentatives</span></div><div className="wp-solver-summary-v2__content"><p className="wp-solver-summary-v2__attempt-text">{getAttemptSummaryLabel(persistedAttemptCount)}</p></div></div>
              <div className="wp-solver-summary-v2__item is-accent-blue"><div className="wp-solver-summary-v2__head"><span className="wp-solver-summary-v2__icon"><ChessPawn size={20} strokeWidth={1.9} /></span><span className="wp-solver-summary-v2__label">Trait</span></div><div className="wp-solver-summary-v2__content"><strong>{sideSummary.label}</strong><p>{sideSummary.description}</p></div></div>
            </div>
          </div>
          <div className="wp-solver-board-nav-v2"><button className="wp-secondary wp-solver-nav-button" disabled={!previousPuzzle} type="button" onClick={() => { if (previousPuzzle) switchPuzzle(previousPuzzle['@id']); }}><ChevronLeft aria-hidden="true" size={18} strokeWidth={2} /><span>Précédent</span></button><button className="wp-primary wp-solver-nav-button" disabled={!nextPuzzle} type="button" onClick={() => { if (nextPuzzle) switchPuzzle(nextPuzzle['@id']); }}><span>Suivant</span><ChevronRight aria-hidden="true" size={18} strokeWidth={2} /></button></div>
        </section>
      </div>
    </div>
  );
}

export default SolverView;











