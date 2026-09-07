import type { UserSettingsOverview } from '../../settings/types/settings.types';
import type { Cycle, CyclePuzzle, CycleStats, Puzzle, Training, TrainingPuzzle, TrainingSummary } from '../../trainings/types/training.types';
import { type PuzzleCompletionResult } from '../components/PuzzleSolver';
import type { AttemptSyncPayload } from '../types/solver.types.ts';

export type SolverViewProps = {
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

export type PuzzleListTone = 'current' | 'failed' | 'pending' | 'solved';

export type AttemptSession = {
  attemptNumber: number;
  clientRequestId: string;
  cyclePuzzleIri: string;
  persistedDurationMilliseconds: number;
  startedAt: number;
  trainingSession: string;
};

export type SolverStatusSummary = {
  accent: 'danger' | 'info' | 'success';
  description: string;
  label: string;
};

export type SolverSideSummary = {
  description: string;
  label: string;
};
