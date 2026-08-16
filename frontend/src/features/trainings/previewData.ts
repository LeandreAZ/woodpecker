import type {
  HistoryOverview,
  Puzzle,
  StatsOverview,
  Training,
  TrainingAnalytics,
  TrainingAttemptHistory,
  TrainingCycleHistory,
  TrainingDashboardSummary,
  TrainingOverview,
  TrainingSummary,
  UserSettingsOverview,
} from './trainingsTypes';
import type { AuthSession } from '../auth/authStorage';

export const previewSession: AuthSession = {
  token: 'preview-token',
  email: 'marc-antoine@woodpecker.local',
};

const trainings: Training[] = [
  {
    '@id': '/trainings/1',
    id: 1,
    name: 'Mate en 2',
    description: 'Entrainement dedie aux combinaisons forcant le mat en deux coups.',
    icon: 'queen',
    mistakeLimit: 3,
    status: 'active',
    createdAt: '2026-05-12T09:00:00+02:00',
  },
  {
    '@id': '/trainings/2',
    id: 2,
    name: 'Tactiques mixtes',
    description: 'Melange equilibre de motifs tactiques frequents.',
    icon: 'knight',
    mistakeLimit: 3,
    status: 'active',
    createdAt: '2026-05-06T09:00:00+02:00',
  },
  {
    '@id': '/trainings/3',
    id: 3,
    name: 'Finales tactiques',
    description: 'Finales avec ressources tactiques cles a convertir.',
    icon: 'rook',
    mistakeLimit: 3,
    status: 'draft',
    createdAt: '2026-05-02T09:00:00+02:00',
  },
  {
    '@id': '/trainings/4',
    id: 4,
    name: 'Themes Lichess 1800+',
    description: 'Selection de themes Lichess adaptes a 1800+.',
    icon: 'pawn',
    mistakeLimit: 3,
    status: 'active',
    createdAt: '2026-04-28T09:00:00+02:00',
  },
];

const puzzles: Puzzle[] = [
  {
    '@id': '/puzzles/1',
    id: 1,
    fen: '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    solution: ['g2g3'],
    themes: ['Mat en 2'],
    rating: 1587,
  },
  {
    '@id': '/puzzles/2',
    id: 2,
    fen: '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    solution: ['h2h3'],
    themes: ['Mat en 2'],
    rating: 1621,
  },
  {
    '@id': '/puzzles/3',
    id: 3,
    fen: '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    solution: ['f2f3'],
    themes: ['Mat en 2'],
    rating: 1603,
  },
  {
    '@id': '/puzzles/4',
    id: 4,
    fen: 'r1b3k1/5ppp/p1b3Q1/4p3/8/5B2/5PPP/5RK1 w - - 0 1',
    solution: ['g6d3'],
    themes: ['Mat en 2', 'Decouverte', 'Alignement'],
    rating: 1654,
  },
  {
    '@id': '/puzzles/5',
    id: 5,
    fen: '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    solution: ['g2g4'],
    themes: ['Mat en 2'],
    rating: 1670,
  },
];

const mateTrainingPuzzles = puzzles.map((puzzle, index) => ({
  '@id': `/training_puzzles/${index + 1}`,
  id: index + 1,
  training: '/trainings/1',
  puzzle,
  position: index,
  personalNote: index === 3 ? 'Position marquee a revoir dans le cycle actif.' : null,
}));

const trainingOverviews: Record<string, TrainingOverview> = {
  '/trainings/1': {
    trainingPuzzles: mateTrainingPuzzles,
    cycles: [
      {
        '@id': '/cycles/2',
        id: 2,
        training: '/trainings/1',
        number: 2,
        status: 'active',
        startedAt: '2026-05-18T09:00:00+02:00',
        completedAt: null,
      },
      {
        '@id': '/cycles/1',
        id: 1,
        training: '/trainings/1',
        number: 1,
        status: 'completed',
        startedAt: '2026-04-28T09:00:00+02:00',
        completedAt: '2026-05-11T18:00:00+02:00',
      },
    ],
    cyclePuzzles: [
      { '@id': '/cycle_puzzles/1', id: 1, cycle: '/cycles/2', trainingPuzzle: '/training_puzzles/1', position: 0, status: 'solved' },
      { '@id': '/cycle_puzzles/2', id: 2, cycle: '/cycles/2', trainingPuzzle: '/training_puzzles/2', position: 1, status: 'solved' },
      { '@id': '/cycle_puzzles/3', id: 3, cycle: '/cycles/2', trainingPuzzle: '/training_puzzles/3', position: 2, status: 'solved' },
      { '@id': '/cycle_puzzles/4', id: 4, cycle: '/cycles/2', trainingPuzzle: '/training_puzzles/4', position: 3, status: 'failed' },
      { '@id': '/cycle_puzzles/5', id: 5, cycle: '/cycles/2', trainingPuzzle: '/training_puzzles/5', position: 4, status: 'pending' },
    ],
    trainingSessions: [
      {
        '@id': '/training_sessions/1',
        id: 1,
        training: '/trainings/1',
        cycle: '/cycles/2',
        startedAt: '2026-05-18T09:00:00+02:00',
      },
    ],
  },
  '/trainings/2': {
    trainingPuzzles: [],
    cycles: [],
    cyclePuzzles: [],
    trainingSessions: [],
  },
  '/trainings/3': {
    trainingPuzzles: [],
    cycles: [],
    cyclePuzzles: [],
    trainingSessions: [],
  },
  '/trainings/4': {
    trainingPuzzles: [],
    cycles: [],
    cyclePuzzles: [],
    trainingSessions: [],
  },
};

const cycleSummaries = [
  {
    attemptCount: 167,
    cycle: {
      '@id': '/cycles/2',
      id: 2,
      training: '/trainings/1',
      number: 2,
      status: 'active',
      startedAt: '2026-05-18T09:00:00+02:00',
      completedAt: null,
    },
    failed: 11,
    pending: 77,
    progressPercent: 36,
    solved: 32,
    total: 120,
  },
  {
    attemptCount: 142,
    cycle: {
      '@id': '/cycles/1',
      id: 1,
      training: '/trainings/1',
      number: 1,
      status: 'completed',
      startedAt: '2026-04-28T09:00:00+02:00',
      completedAt: '2026-05-11T18:00:00+02:00',
    },
    failed: 9,
    pending: 0,
    progressPercent: 100,
    solved: 120,
    total: 120,
  },
];

const trainingSummaries: Record<string, TrainingSummary> = {
  '/trainings/1': {
    puzzleCount: 120,
    ratedPuzzleCount: 104,
    themedPuzzleCount: 58,
    notedPuzzleCount: 12,
    attemptCount: 167,
    solvedAttemptCount: 32,
    averageMistakes: 1.39,
    latestCycleSummary: cycleSummaries[0],
    cycleSummaries,
    latestAttempts: [
      { '@id': '/attempts/1', id: 1, successful: true, mistakesCount: 0, durationMilliseconds: 28000, attemptedAt: '2026-05-18T21:47:00+02:00', cycleNumber: 2, trainingPuzzlePosition: 31 },
      { '@id': '/attempts/2', id: 2, successful: false, mistakesCount: 1, durationMilliseconds: 72000, attemptedAt: '2026-05-18T21:45:00+02:00', cycleNumber: 2, trainingPuzzlePosition: 30 },
      { '@id': '/attempts/3', id: 3, successful: true, mistakesCount: 0, durationMilliseconds: 35000, attemptedAt: '2026-05-18T21:42:00+02:00', cycleNumber: 2, trainingPuzzlePosition: 29 },
    ],
  },
};

const dashboardSummaries: TrainingDashboardSummary[] = [
  {
    training: trainings[0],
    puzzleCount: 1250,
    attemptCount: 2846,
    progressPercent: 61,
    solvedCount: 763,
    failedCount: 87,
    pendingCount: 400,
    latestCycleNumber: 5,
    latestCycleStatus: 'active',
    hasResumableCycle: true,
    latestAttemptedAt: '2026-08-10T18:12:00+02:00',
    descriptionReady: true,
  },
  {
    training: trainings[1],
    puzzleCount: 1800,
    attemptCount: 3102,
    progressPercent: 100,
    solvedCount: 1800,
    failedCount: 0,
    pendingCount: 0,
    latestCycleNumber: 3,
    latestCycleStatus: 'completed',
    hasResumableCycle: false,
    latestAttemptedAt: '2026-08-10T16:20:00+02:00',
    descriptionReady: true,
  },
  {
    training: trainings[2],
    puzzleCount: 620,
    attemptCount: 0,
    progressPercent: 0,
    solvedCount: 0,
    failedCount: 0,
    pendingCount: 620,
    latestCycleNumber: null,
    latestCycleStatus: null,
    hasResumableCycle: false,
    latestAttemptedAt: '2026-08-09T11:00:00+02:00',
    descriptionReady: true,
  },
  {
    training: trainings[3],
    puzzleCount: 2400,
    attemptCount: 4612,
    progressPercent: 37,
    solvedCount: 888,
    failedCount: 112,
    pendingCount: 1400,
    latestCycleNumber: 4,
    latestCycleStatus: 'active',
    hasResumableCycle: true,
    latestAttemptedAt: '2026-08-10T12:10:00+02:00',
    descriptionReady: true,
  },
];

const statsOverview: StatsOverview = {
  trainingCount: 127,
  puzzleCount: 3842,
  attemptCount: 6751,
  successfulAttemptCount: 4568,
  successRate: 67.6,
  averageMistakes: 1.8,
  activeCycleCount: 3,
  completedCycleCount: 16,
  resumableTrainingCount: 2,
  solvedCyclePuzzleCount: 2180,
  failedCyclePuzzleCount: 734,
  pendingCyclePuzzleCount: 928,
  latestAttemptedAt: '2026-08-10T18:12:00+02:00',
  trainingBreakdown: dashboardSummaries,
};

const historyOverview: HistoryOverview = {
  attemptCount: 1248,
  successfulAttemptCount: 928,
  failedAttemptCount: 320,
  cycleCount: 38,
  activeCycleCount: 3,
  completedCycleCount: 35,
  latestAttemptedAt: '2026-05-31T10:24:00+02:00',
  recentAttempts: [
    { '@id': '/history_attempts/1', id: 1, training: { '@id': '/trainings/1', id: 1, name: 'Mate en 2', description: trainings[0].description, icon: trainings[0].icon, status: 'active' }, successful: true, mistakesCount: 0, durationMilliseconds: 18000, attemptedAt: '2026-05-31T10:24:00+02:00', cycleNumber: 37, trainingPuzzlePosition: 18236 },
    { '@id': '/history_attempts/2', id: 2, training: { '@id': '/trainings/1', id: 1, name: 'Mate en 2', description: trainings[0].description, icon: trainings[0].icon, status: 'active' }, successful: true, mistakesCount: 0, durationMilliseconds: 31000, attemptedAt: '2026-05-31T10:22:00+02:00', cycleNumber: 37, trainingPuzzlePosition: 18235 },
    { '@id': '/history_attempts/3', id: 3, training: { '@id': '/trainings/1', id: 1, name: 'Mate en 2', description: trainings[0].description, icon: trainings[0].icon, status: 'active' }, successful: false, mistakesCount: 2, durationMilliseconds: 67000, attemptedAt: '2026-05-31T10:20:00+02:00', cycleNumber: 37, trainingPuzzlePosition: 18234 },
  ],
  recentCycles: [
    { training: { '@id': '/trainings/1', id: 1, name: 'Mate en 2', description: trainings[0].description, icon: trainings[0].icon, status: 'active' }, cycle: { '@id': '/cycles/37', id: 37, training: '/trainings/1', number: 37, status: 'completed', startedAt: '2026-05-31T08:00:00+02:00', completedAt: '2026-05-31T10:30:00+02:00' }, solved: 43, failed: 7, pending: 0, total: 50, progressPercent: 86, attemptCount: 50, hasResumableCycle: false },
    { training: { '@id': '/trainings/1', id: 1, name: 'Mate en 2', description: trainings[0].description, icon: trainings[0].icon, status: 'active' }, cycle: { '@id': '/cycles/36', id: 36, training: '/trainings/1', number: 36, status: 'completed', startedAt: '2026-05-29T08:00:00+02:00', completedAt: '2026-05-29T10:30:00+02:00' }, solved: 39, failed: 11, pending: 0, total: 50, progressPercent: 78, attemptCount: 48, hasResumableCycle: false },
    { training: { '@id': '/trainings/1', id: 1, name: 'Mate en 2', description: trainings[0].description, icon: trainings[0].icon, status: 'active' }, cycle: { '@id': '/cycles/35', id: 35, training: '/trainings/1', number: 35, status: 'active', startedAt: '2026-05-27T08:00:00+02:00', completedAt: null }, solved: 28, failed: 22, pending: 0, total: 50, progressPercent: 56, attemptCount: 38, hasResumableCycle: true },
  ],
};

const trainingAttemptHistory: Record<string, TrainingAttemptHistory> = {
  '/trainings/1': {
    training: trainings[0],
    attemptCount: 50,
    successfulAttemptCount: 37,
    failedAttemptCount: 13,
    latestAttemptedAt: '2026-05-31T10:24:00+02:00',
    attempts: [
      {
        '@id': '/detailed_attempts/1',
        id: 1,
        successful: true,
        mistakesCount: 0,
        durationMilliseconds: 18000,
        playedMoves: ['Qg6+', 'Kh8', 'Qd8#'],
        attemptedAt: '2026-05-31T10:24:00+02:00',
        cycle: { '@id': '/cycles/37', id: 37, number: 37, status: 'completed' },
        cyclePuzzle: { '@id': '/cycle_puzzles/120', id: 120, position: 0, status: 'solved' },
        trainingPuzzle: { '@id': '/training_puzzles/1', id: 1, position: 0, personalNote: null },
        puzzle: puzzles[0],
      },
      {
        '@id': '/detailed_attempts/2',
        id: 2,
        successful: false,
        mistakesCount: 1,
        durationMilliseconds: 72000,
        playedMoves: ['Qh6?', 'gxh6'],
        attemptedAt: '2026-05-31T10:22:00+02:00',
        cycle: { '@id': '/cycles/37', id: 37, number: 37, status: 'completed' },
        cyclePuzzle: { '@id': '/cycle_puzzles/121', id: 121, position: 1, status: 'failed' },
        trainingPuzzle: { '@id': '/training_puzzles/4', id: 4, position: 3, personalNote: 'Position delicate.' },
        puzzle: puzzles[3],
      },
    ],
  },
};

const trainingCycleHistory: Record<string, TrainingCycleHistory> = {
  '/trainings/1': {
    training: trainings[0],
    cycleCount: 7,
    activeCycleCount: 1,
    completedCycleCount: 6,
    cycles: [
      {
        cycle: { '@id': '/cycles/37', id: 37, training: '/trainings/1', number: 37, status: 'completed', startedAt: '2026-05-31T08:00:00+02:00', completedAt: '2026-05-31T10:30:00+02:00', targetDurationSeconds: 900 },
        solved: 43,
        failed: 7,
        pending: 0,
        total: 50,
        progressPercent: 86,
        attemptCount: 50,
        latestAttemptedAt: '2026-05-31T10:24:00+02:00',
        hasResumableCycle: false,
        cyclePuzzles: [],
      },
      {
        cycle: { '@id': '/cycles/35', id: 35, training: '/trainings/1', number: 35, status: 'active', startedAt: '2026-05-27T08:00:00+02:00', completedAt: null, targetDurationSeconds: 900 },
        solved: 28,
        failed: 22,
        pending: 0,
        total: 50,
        progressPercent: 56,
        attemptCount: 38,
        latestAttemptedAt: '2026-05-27T10:12:00+02:00',
        hasResumableCycle: true,
        cyclePuzzles: [],
      },
    ],
  },
};

const trainingAnalytics: Record<string, TrainingAnalytics> = {
  '/trainings/1': {
    training: trainings[0],
    performance: {
      attemptCount: 167,
      solvedAttemptCount: 32,
      failedAttemptCount: 11,
      successRate: 74.5,
      averageMistakes: 1.39,
      averageDurationSeconds: 27,
      latestAttemptedAt: '2026-05-18T21:47:00+02:00',
    },
    puzzleReadiness: {
      puzzleCount: 120,
      ratedPuzzleCount: 104,
      themedPuzzleCount: 58,
      notedPuzzleCount: 12,
    },
    progressionSnapshot: {
      activeCycleCount: 1,
      completedCycleCount: 1,
      resumableCycle: true,
      latestCycleProgressPercent: 36,
      bestCycleProgressPercent: 100,
    },
    cycleTimeline: cycleSummaries,
  },
};

const userSettingsOverview: UserSettingsOverview = {
  user: {
    '@id': '/users/me',
    id: 1,
    email: 'marc.bertrand@example.com',
    roles: ['Utilisateur Premium'],
    createdAt: '2026-04-18T09:00:00+02:00',
  },
  workspace: {
    trainingCount: 7,
    activeTrainingCount: 7,
    archivedTrainingCount: 12,
    puzzleCount: 60,
    latestTrainingName: 'Mate en 2',
  },
  preferencesPreview: {
    defaultMistakeLimit: 3,
    lockTrainingAfterCycle: true,
    trackedSolverByDefault: true,
  },
  integrations: {
    lichessConnected: false,
    chessComConnected: false,
    exportReady: false,
  },
};

export function isPreviewSession(session: AuthSession): boolean {
  return session.token === previewSession.token;
}

export function getPreviewTrainings(): Training[] {
  return trainings;
}

export function getPreviewDashboardSummaries(): TrainingDashboardSummary[] {
  return dashboardSummaries;
}

export function getPreviewStatsOverview(): StatsOverview {
  return statsOverview;
}

export function getPreviewHistoryOverview(): HistoryOverview {
  return historyOverview;
}

export function getPreviewTrainingAttemptHistory(trainingIri: string): TrainingAttemptHistory {
  return trainingAttemptHistory[trainingIri] ?? trainingAttemptHistory['/trainings/1'];
}

export function getPreviewTrainingCycleHistory(trainingIri: string): TrainingCycleHistory {
  return trainingCycleHistory[trainingIri] ?? trainingCycleHistory['/trainings/1'];
}

export function getPreviewUserSettingsOverview(): UserSettingsOverview {
  return userSettingsOverview;
}

export function getPreviewTrainingOverview(trainingIri: string): TrainingOverview {
  return trainingOverviews[trainingIri] ?? trainingOverviews['/trainings/1'];
}

export function getPreviewTrainingSummary(trainingIri: string): TrainingSummary {
  return trainingSummaries[trainingIri] ?? trainingSummaries['/trainings/1'];
}

export function getPreviewTrainingAnalytics(trainingIri: string): TrainingAnalytics {
  return trainingAnalytics[trainingIri] ?? trainingAnalytics['/trainings/1'];
}

export function getPreviewPuzzle(puzzleIri: string): Puzzle | null {
  return puzzles.find((puzzle) => puzzle['@id'] === puzzleIri) ?? null;
}
