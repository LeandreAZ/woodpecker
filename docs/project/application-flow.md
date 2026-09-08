# Flux de l'application

## Connexion

```text
AuthPanel
 -> POST /api/login_check
 -> firewall Symfony `login`
 -> User provider par email
 -> password hasher
 -> LexikJWT success handler
 -> token JWT
 -> authStorage local
 -> requêtes suivantes avec Authorization: Bearer
```

Un `401` provenant d'une requête authentifiée déclenche l'événement navigateur `woodpecker:unauthorized`. `App.tsx` nettoie alors la session locale et renvoie vers `/auth`.

## Chargement du dashboard

```text
route /dashboard
 -> TrainingsPanel state
 -> TanStack Query
 -> GET /api/trainings/dashboard
 -> TrainingDashboardAction
 -> données agrégées
 -> cache query
 -> composants dashboard
```

## Mutation d'entraînement

```text
UI
 -> mutation TanStack Query
 -> API Platform
 -> TrainingOwnerProcessor
 -> Doctrine
 -> PostgreSQL
 -> réponse
 -> invalidateQueries
 -> nouvel affichage
```

## Solver

```text
CyclePuzzle sélectionné
 -> PuzzleSolver reçoit FEN + solution
 -> chess.js rejoue/valide
 -> état local de tentative
 -> snapshot localStorage périodique
 -> POST /api/attempts avec clientRequestId
 -> OwnedTrainingResourceProcessor
 -> SolverAttemptLifecycleService
 -> Attempt persistée/mergée
 -> agrégation CyclePuzzle
 -> éventuelle complétion du Cycle
 -> invalidation des données Training
 -> History/Stats voient les nouvelles tentatives
```

## Import CSV

```text
multipart CSV
 -> analyze endpoint
 -> CsvPuzzleParser
 -> validation FEN/UCI
 -> TrainingCsvAnalysisService
 -> CsvAnalysisStore
 -> analysisId
 -> aperçu frontend
 -> import avec analysisId
 -> TrainingPuzzleImportService
 -> Puzzle + TrainingPuzzle
```

## Import Lichess

```text
critères UI
 -> availability
 -> LichessDatasetProvider SQL
 -> import
 -> sélection déterministe/seed
 -> NormalizedPuzzle[]
 -> TrainingPuzzleImportService
```

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
