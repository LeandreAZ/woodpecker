# Page frontend — Solver

## Route

`/trainings/:id/solver`

## Fichiers principaux

- `frontend/src/features/solver/components/PuzzleSolver.test.tsx`
- `frontend/src/features/solver/components/PuzzleSolver.tsx`
- `frontend/src/features/solver/components/SolverControls.tsx`
- `frontend/src/features/solver/components/SolverProgress.tsx`
- `frontend/src/features/solver/components/SolverPuzzleList.tsx`
- `frontend/src/features/solver/components/SolverSummary.tsx`
- `frontend/src/features/solver/domain/puzzleValidation.test.ts`
- `frontend/src/features/solver/domain/puzzleValidation.ts`
- `frontend/src/features/solver/domain/solverViewModel.ts`
- `frontend/src/features/solver/hooks/useSolverActions.ts`
- `frontend/src/features/solver/pages/SolverView.test.tsx`
- `frontend/src/features/solver/pages/SolverView.tsx`
- `frontend/src/features/solver/services/chessboardPreferences.ts`
- `frontend/src/features/solver/services/solverPersistence.ts`
- `frontend/src/features/solver/styles/puzzle-solver.css`
- `frontend/src/features/solver/styles/solver.css`
- `frontend/src/features/solver/types/solver.types.ts`
- `frontend/src/features/solver/types/solverView.types.ts`
- `frontend/src/features/solver/utils/solverFormatting.ts`

## Responsabilités de `SolverView`

`SolverView.tsx` orchestre :
- CyclePuzzle courant ;
- pagination de collection ;
- snapshot du composant échiquier ;
- session de tentative ;
- durée ;
- état failed/frozen/resolved ;
- persistance périodique ;
- sélection puzzle précédent/suivant ;
- summary du cycle.

`PROGRESS_SAVE_INTERVAL_MS = 10000` impose une sauvegarde périodique de progression toutes les 10 secondes dans le fonctionnement actuel.

## Trois niveaux d'état

### État échiquier
`PuzzleSolverSnapshot` contient l'avancement immédiat de la position.

### Session de tentative
`AttemptSession` identifie l'essai logique courant et son horloge.

### État serveur
`CyclePuzzle` + `Attempt[]` viennent du backend.

Ces couches ne doivent pas être fusionnées naïvement : l'utilisateur peut avoir joué localement quelque chose qui n'est pas encore confirmé par le serveur.

## Persistance locale

`solverPersistence.ts` utilise la clé :

`woodpecker:solver:attempts:v2`.

Chaque snapshot pending est indexé par `clientRequestId`.

L'application tente de renvoyer les pending :
- au chargement pertinent ;
- quand le navigateur revient online ;
- au focus ;
- lors d'un retour de visibilité.

## `clientRequestId`

Il est créé avec `crypto.randomUUID()` si disponible.

Il identifie **l'intention de sauvegarder la même tentative**, même si plusieurs requêtes similaires partent. C'est la base de l'idempotence serveur.

## Optimistic update

`useSolverActions.ts` construit une Attempt optimiste et patch le cache de CyclePuzzle avant réponse réseau.

Cela rend l'UI réactive, mais impose que le serveur reste l'arbitre final. Après succès, les données Training sont invalidées.

## Timer

La durée affichée combine :
- durée persistée du CyclePuzzle ;
- durée d'une éventuelle snapshot pending ;
- durée de l'Attempt active ;
- temps écoulé local depuis `startedAt`.

Les fonctions utilisent `max()` à plusieurs endroits afin d'éviter qu'une réponse réseau plus ancienne fasse reculer le compteur.

## État `failed`

`failed` ne signifie pas nécessairement « jamais résolu ». Le frontend consulte aussi la présence d'une résolution et le gel.

## Settings

La clé de préférences du Solver tient compte de :
- animateMoves ;
- coordinates ;
- legal moves ;
- right-click targets ;
- couleurs de cases.

## Points dangereux à modifier

- génération/réutilisation `clientRequestId` ;
- ordre des saves ;
- logique de freeze ;
- calcul de durée ;
- navigation pendant une requête ;
- localStorage pending ;
- optimistic cache.

Un changement sur l'un de ces points doit relancer les tests Solver et le scénario Playwright multi-tentatives.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.

## Tests directement associés

- `frontend/src/features/solver/components/PuzzleSolver.test.tsx`
- `frontend/src/features/solver/domain/puzzleValidation.test.ts`
- `frontend/src/features/solver/pages/SolverView.test.tsx`
- `frontend/e2e/chessboard.spec.ts`
- `frontend/e2e/solver.spec.ts`
