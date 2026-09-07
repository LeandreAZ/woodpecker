import type { AttemptStatus } from '../../trainings/types/training.types';

type SolverAttemptSnapshot = {
  attemptNumber: number;
  clientRequestId: string;
  cyclePuzzleDurationMilliseconds: number;
  cyclePuzzleIri: string;
  durationMilliseconds: number;
  mistakesCount: number;
  playedMoves: string[];
  status: AttemptStatus;
  trainingIri: string;
  trainingSession: string;
  updatedAt: number;
};

const attemptStorageKey = 'woodpecker:solver:attempts:v2';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStorageMap<T>(key: string): Record<string, T> {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' ? (parsedValue as Record<string, T>) : {};
  } catch {
    return {};
  }
}

function writeStorageMap<T>(key: string, value: Record<string, T>) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function upsertPendingSolverAttempt(snapshot: Omit<SolverAttemptSnapshot, 'updatedAt'>) {
  const current = readStorageMap<SolverAttemptSnapshot>(attemptStorageKey);
  current[snapshot.clientRequestId] = {
    ...snapshot,
    updatedAt: Date.now(),
  };
  writeStorageMap(attemptStorageKey, current);
}

export function removePendingSolverAttempt(clientRequestId: string) {
  const current = readStorageMap<SolverAttemptSnapshot>(attemptStorageKey);
  if (!(clientRequestId in current)) {
    return;
  }

  delete current[clientRequestId];
  writeStorageMap(attemptStorageKey, current);
}

export function listPendingSolverAttempts(trainingIri?: string | null) {
  return Object.values(readStorageMap<SolverAttemptSnapshot>(attemptStorageKey))
    .filter((snapshot) => !trainingIri || snapshot.trainingIri === trainingIri)
    .sort((left, right) => left.updatedAt - right.updatedAt);
}

export function getLatestPendingSolverAttemptForCyclePuzzle(trainingIri: string | null | undefined, cyclePuzzleIri: string | null | undefined) {
  if (!trainingIri || !cyclePuzzleIri) {
    return null;
  }

  return listPendingSolverAttempts(trainingIri)
    .filter((snapshot) => snapshot.cyclePuzzleIri === cyclePuzzleIri)
    .at(-1) ?? null;
}

export function createSolverAttemptClientRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'solver-attempt-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

export type { SolverAttemptSnapshot };


type SolverNavigationSnapshotHandler = () => void;

let solverNavigationSnapshotHandler: SolverNavigationSnapshotHandler | null = null;

export function registerSolverNavigationSnapshotHandler(handler: SolverNavigationSnapshotHandler) {
  solverNavigationSnapshotHandler = handler;

  return () => {
    if (solverNavigationSnapshotHandler === handler) {
      solverNavigationSnapshotHandler = null;
    }
  };
}

export function flushSolverNavigationSnapshot() {
  solverNavigationSnapshotHandler?.();
}
