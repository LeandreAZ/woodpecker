# Référence — contrats frontend principaux

Les types TypeScript ne remplacent pas une validation runtime : ils documentent ce que le frontend attend.

## `Training`

Identité, branding, status et timestamps principaux.

## `TrainingOverview`

Regroupe :
- `trainingPuzzles[]`
- `cycles[]`
- `cyclePuzzles[]`
- `trainingSessions[]`.

C'est la base de nombreuses vues Training/Solver.

## `CyclePuzzle`

Champs dérivés importants :
- `attempts`
- `activeAttempt`
- `completedAttemptCount`
- `completedDurationMilliseconds`
- `hasSolvedAttempt`.

Ces valeurs permettent au frontend de ne pas recalculer tout le lifecycle depuis des requêtes séparées.

## `Attempt`

Contrat :
- `clientRequestId`
- `attemptNumber`
- `status`
- `playedMoves`
- `mistakesCount`
- `durationMilliseconds`
- timestamps.

## `TrainingSummary`

Comprend :
- readiness de collection ;
- latestCycleSummary ;
- cycleSummaries ;
- attemptCountDistribution ;
- latestAttempts ;
- dailyActivity.

## `TrainingAnalytics`

Sépare :
- `performance`
- `puzzleReadiness`
- `progressionSnapshot`
- `cycleTimeline`.

## `StatsOverview`

Agrégat global multi-training.

## `HistoryOverview`

Timeline homogène attempts/login/logout + availableTrainings pour filtres.

## `UserSettingsOverview`

Sections :
- user
- profile
- appearance
- board
- solverPreferences
- security
- workspace.

Lorsqu'un ReadModel backend change, vérifier ces types et les composants qui les consomment.
