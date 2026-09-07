import type { CyclePuzzle } from '../../trainings/types/training.types';

export type PuzzleCompletionResult = {
  mistakesCount: number;
  playedMoves: string[];
};

export type PuzzleSolverSnapshot = {
  completed: boolean;
  evaluationFailed: boolean;
  feedback: Feedback;
  mistakesCount: number;
  playedMoves: string[];
  resolved: boolean;
};

export type Feedback = {
  kind: 'info' | 'success' | 'error';
  message: string;
};

export type AttemptSyncPayload = {
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

