import type { PuzzleCsvRow } from './csvImport';

export type View = 'dashboard' | 'create' | 'detail' | 'import' | 'solver';

export const mistakeLimitOptions = [1, 3, 5];

export type Training = {
  '@id': string;
  id: number;
  name: string;
  description?: string | null;
  mistakeLimit: number;
  status: string;
  createdAt: string;
};

export type Puzzle = {
  '@id': string;
  id: number;
  fen?: string | null;
  solution: string[];
  themes: string[];
  rating?: number | null;
};

export type TrainingPuzzle = {
  '@id': string;
  id: number;
  training: string;
  puzzle: Puzzle | string;
  position: number;
  personalNote?: string | null;
};

export type Cycle = {
  '@id': string;
  id: number;
  training: string;
  number: number;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type CyclePuzzle = {
  '@id': string;
  id: number;
  cycle: string;
  trainingPuzzle: string;
  position: number;
  status: string;
};

export type TrainingSession = {
  '@id': string;
  id: number;
  training: string;
  cycle?: string | null;
  startedAt: string;
};

export type Attempt = {
  '@id': string;
  id: number;
  cyclePuzzle: string;
  trainingSession: string;
  playedMoves: string[];
  successful: boolean;
  mistakesCount: number;
  durationMilliseconds: number;
  attemptedAt: string;
};

export type CycleStats = {
  failed: number;
  pending: number;
  progressPercent: number;
  solved: number;
  total: number;
};

export type ApiCollection<Item> = {
  member?: Item[];
  'hydra:member'?: Item[];
  view?: CollectionView;
  'hydra:view'?: CollectionView;
};

export type CollectionView = {
  next?: string;
  'hydra:next'?: string;
};

export type ImportPreview = {
  csvErrors: string[];
  csvFileName: string;
  csvRows: PuzzleCsvRow[];
};
