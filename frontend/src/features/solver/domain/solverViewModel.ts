import type { CyclePuzzle } from '../../trainings/types/training.types';
import { type PuzzleSolverSnapshot } from '../components/PuzzleSolver';
import { getSideToMoveMeta } from '../services/chessboardPreferences';
import {
  createSolverAttemptClientRequestId,
  getLatestPendingSolverAttemptForCyclePuzzle
} from '../services/solverPersistence';
import type { AttemptSession, PuzzleListTone, SolverSideSummary, SolverStatusSummary } from '../types/solverView.types';

export const INITIAL_SOLVER_SNAPSHOT: PuzzleSolverSnapshot = {
  completed: false,
  evaluationFailed: false,
  feedback: { kind: 'info', message: 'Trouvez le meilleur coup.' },
  mistakesCount: 0,
  playedMoves: [],
  resolved: false,
};

export function getCompletedAttemptCount(cyclePuzzle?: CyclePuzzle | null) {
  if (!cyclePuzzle) return 0;
  if (typeof cyclePuzzle.completedAttemptCount === 'number') return cyclePuzzle.completedAttemptCount;
  return cyclePuzzle.attempts?.filter((attempt) => attempt.status !== 'in_progress').length ?? 0;
}

export function getHasSolvedAttempt(cyclePuzzle?: CyclePuzzle | null) {
  if (!cyclePuzzle) return false;
  if (typeof cyclePuzzle.hasSolvedAttempt === 'boolean') return cyclePuzzle.hasSolvedAttempt;
  return cyclePuzzle.attempts?.some((attempt) => attempt.status === 'solved') ?? false;
}

export function getActiveAttempt(cyclePuzzle?: CyclePuzzle | null) {
  if (!cyclePuzzle) return null;
  return cyclePuzzle.activeAttempt ?? cyclePuzzle.attempts?.find((attempt) => attempt.status === 'in_progress') ?? null;
}

export function isSolved(cyclePuzzle?: CyclePuzzle | null, saved?: Set<string>) {
  return Boolean(cyclePuzzle && (cyclePuzzle.status === 'solved' || saved?.has(cyclePuzzle['@id'])));
}

export function isFailed(cyclePuzzle?: CyclePuzzle | null, failed?: Set<string>) {
  return Boolean(cyclePuzzle && (cyclePuzzle.status === 'failed' || failed?.has(cyclePuzzle['@id'])));
}

export function isFrozen(cyclePuzzle?: CyclePuzzle | null, saved?: Set<string>) {
  if (!cyclePuzzle) return false;
  return cyclePuzzle.status === 'solved'
    || (cyclePuzzle.status === 'failed' && getHasSolvedAttempt(cyclePuzzle))
    || Boolean(saved?.has(cyclePuzzle['@id']));
}

export function getPuzzleListStatus(cyclePuzzle?: CyclePuzzle | null) {
  if (!cyclePuzzle || cyclePuzzle.status === 'pending') return { label: 'Non tenté', tone: 'pending' as PuzzleListTone };
  if (cyclePuzzle.status === 'in_progress') return { label: 'En cours', tone: 'current' as PuzzleListTone };
  if (cyclePuzzle.status === 'solved') return { label: 'Résolu', tone: 'solved' as PuzzleListTone };
  return { label: 'Raté', tone: 'failed' as PuzzleListTone };
}

export function getPuzzlePageSize(width: number) {
  return width >= 1024 ? 10 : 5;
}

export function createInitialSnapshot(cyclePuzzle: CyclePuzzle | null): PuzzleSolverSnapshot {
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

export function buildStatusSummary(evaluationFailed: boolean, frozen: boolean, resolved: boolean, inProgress: boolean): SolverStatusSummary {
  if (resolved && evaluationFailed) return { accent: 'danger', description: 'Trouvez le meilleur coup.', label: 'Raté' };
  if (resolved) return { accent: 'success', description: 'Vous avez trouvé le meilleur coup.', label: frozen ? 'Réussi' : 'Trouvé' };
  if (evaluationFailed) return { accent: 'danger', description: 'Trouvez le meilleur coup.', label: 'Raté' };
  if (inProgress) return { accent: 'info', description: 'Trouvez le meilleur coup !', label: 'En cours' };
  return { accent: 'info', description: 'Trouvez le meilleur coup.', label: 'À vous de jouer' };
}

export function buildSideSummary(fen?: string | null): SolverSideSummary {
  const side = getSideToMoveMeta(fen);
  return { label: side.label, description: side.description };
}

export function buildAttemptSession(
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
    createSolverAttemptClientRequestId(),
    0,
  );
}

export function attemptSessionsMatch(left: AttemptSession | null, right: AttemptSession | null) {
  if (!left || !right) {
    return left === right;
  }

  return left.attemptNumber === right.attemptNumber
    && left.clientRequestId === right.clientRequestId
    && left.cyclePuzzleIri === right.cyclePuzzleIri
    && left.trainingSession === right.trainingSession;
}

export function solverSnapshotsMatch(left: PuzzleSolverSnapshot, right: PuzzleSolverSnapshot) {
  return left.completed === right.completed
    && left.evaluationFailed === right.evaluationFailed
    && left.feedback.kind === right.feedback.kind
    && left.feedback.message === right.feedback.message
    && left.mistakesCount === right.mistakesCount
    && left.resolved === right.resolved
    && left.playedMoves.length === right.playedMoves.length
    && left.playedMoves.every((move, index) => move === right.playedMoves[index]);
}
