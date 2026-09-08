# Moteur du Solver — flux complet

## Vue d'ensemble

Le Solver est le cœur métier le plus sensible. Il combine :
- état d'échiquier ;
- validation chess.js ;
- règles d'échec ;
- création de tentatives ;
- durée ;
- persistance locale ;
- persistance HTTP ;
- fusion idempotente backend ;
- agrégation CyclePuzzle ;
- complétion du cycle.

## 1. Position et solution

`Puzzle.fen` définit la position initiale. `Puzzle.solution` stocke une liste de coups UCI.

Exemple UCI :
- `e2e4`
- promotion : `e7e8q`.

## 2. Validation

`puzzleValidation.ts` :
- normalise FEN ;
- crée `new Chess(fen)` ;
- normalise les coups en minuscules ;
- vérifie le pattern UCI ;
- rejoue chaque coup avec chess.js ;
- valide promotions ;
- refuse une séquence illégale.

Le backend possède aussi une validation CSV afin de ne pas faire confiance uniquement au navigateur.

## 3. Côté à jouer

La FEN contient le trait (`w`/`b`). L'interface en déduit la synthèse et l'orientation/interaction appropriée.

## 4. Début d'une tentative

`buildAttemptSession` associe :
- CyclePuzzle ;
- TrainingSession ;
- numéro de tentative ;
- `clientRequestId` ;
- timestamps/durée persistée.

## 5. Coup correct

Le snapshot avance dans la séquence attendue. L'interface peut jouer la réponse automatique du puzzle selon le flux du composant.

## 6. Premier échec

La tentative devient failed. Le CyclePuzzle agrégé passe failed, mais reste **non gelé tant qu'aucune Attempt solved n'existe**.

Cette nuance permet de créer une nouvelle tentative.

## 7. Rattrapage

Une nouvelle Attempt solved est enregistrée. Le CyclePuzzle reste `failed` pour conserver l'échec initial, mais la présence du solved le rend terminal et « rescued » dans les ReadModels.

## 8. Direct

Si la première résolution arrive sans failed antérieure, l'agrégat passe `solved`.

## 9. `clientRequestId`

Le navigateur sauvegarde l'intention dans localStorage puis POST `/api/attempts`.

Le backend :
- cherche d'abord la tentative par ID client ;
- sinon, pour un in_progress sans ID, peut récupérer l'active existante ;
- fusionne au lieu de dupliquer.

## 10. Fusion monotone

Une requête plus ancienne ne doit pas réduire les données déjà reçues :
- playedMoves : garde la liste la plus longue ;
- duration : max ;
- mistakes : max ;
- attemptNumber : max ;
- statut terminal ne revient jamais à in_progress.

## 11. Persistance pending

Les snapshots locaux sont rejoués lors des événements réseau/focus/visibility. Une réussite serveur retire l'entrée pending.

## 12. Gel

Après direct ou rescued, le CyclePuzzle est frozen. Une nouvelle tentative concurrente est rejetée.

## 13. Cycle

À chaque agrégation, `CycleCompletionService` peut terminer le cycle si tous ses CyclePuzzles sont terminaux.

## 14. Conséquences History/Stats

Les Attempts sont la matière première historique. Les ReadModels reconstruisent :
- nombre d'essais ;
- réussite directe ;
- rattrapage ;
- non résolu ;
- durée ;
- progression entre cycles.

## Risques de régression

Toute modification du Solver peut toucher simultanément :
- `SolverView.tsx`
- `PuzzleSolver.tsx`
- `useSolverActions.ts`
- `solverPersistence.ts`
- `SolverAttemptLifecycleService.php`
- `AttemptRepository.php`
- `TrainingSummaryReader.php`
- `StatsOverviewReader.php`
- E2E `solver.spec.ts`.

Ne jamais modifier une seule couche en supposant que les autres « suivront automatiquement ».

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
- `frontend/e2e/solver.spec.ts`
- `backend/tests/Controller/TrainingAttemptHistoryActionTest.php`
- `backend/tests/Controller/TrainingCycleHistoryActionTest.php`
- `backend/tests/Service/CycleCompletionServiceTest.php`
- `backend/tests/Service/SolverAttemptLifecycleServiceTest.php`
