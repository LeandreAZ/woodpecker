import type { UseMutationResult } from '@tanstack/react-query';
import { type LucideIcon } from 'lucide-react';
import type { Cycle, CyclePuzzle, CycleStats, Training, TrainingAnalytics, TrainingPuzzle, TrainingSummary } from './training.types';

export type DetailViewProps = {
  analytics: TrainingAnalytics | null;
  analyticsError?: string;
  analyticsIsError: boolean;
  analyticsIsLoading: boolean;
  createPuzzleMutation: UseMutationResult<TrainingPuzzle, Error, void, unknown>;
  currentCycle: Cycle | null;
  cyclePuzzles: CyclePuzzle[];
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
  onBackToDashboard: () => void;
  onDeleteTraining: () => void;
  deleteTrainingIsPending: boolean;
  onEditTraining: () => void;
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
  onViewAllAttemptHistory: () => void;
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

export type DetailStat = {
  icon: LucideIcon;
  label: string;
  tone: 'success' | 'primary' | 'info' | 'danger' | 'neutral' | 'violet';
  value: string;
};

export type PuzzleRow = {
  accessDisabled: boolean;
  attemptedAtLabel: string;
  firstAttemptLabel: string;
  id: string;
  note?: string | null;
  positionLabel: string;
  previewFen?: string | null;
  ratingLabel: string;
  ratingValueLabel: string;
  statusLabel: string;
  statusTone: 'success' | 'danger' | 'neutral' | 'primary';
  attemptsLabel: string;
};

export type AttemptCard = {
  accent: 'success' | 'danger' | 'neutral';
  icon: LucideIcon;
  id: string;
  subtitle: string;
  timestamp: string;
  title: string;
};

