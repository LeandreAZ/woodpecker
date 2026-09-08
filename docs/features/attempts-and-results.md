# Tentatives, résultats et sémantique

## Attempt ≠ move

Un coup UCI comme `e2e4` est un élément de `Attempt.playedMoves`.

Une `Attempt` est un essai complet, portant :
- `attemptNumber` ;
- `status` ;
- `playedMoves` ;
- `mistakesCount` ;
- `durationMilliseconds` ;
- `clientRequestId`.

## Statuts Attempt

`in_progress`, `failed`, `solved`.

## Statuts CyclePuzzle

`pending`, `in_progress`, `solved`, `failed`, `skipped`.

## Agrégation exacte

`SolverAttemptLifecycleService::refreshCyclePuzzleAggregate()` applique :

1. s'il existe une Attempt solved :
   - avec aucune failed -> `CyclePuzzle.solved`
   - avec une failed -> `CyclePuzzle.failed`
2. sinon s'il existe une failed -> `failed`
3. sinon s'il existe une active -> `in_progress`
4. sinon -> `pending`.

Cette règle encode directement **direct vs rescued**.

## Formules ReadModel

Dans `TrainingSummaryReader` :
- `rescuedCount` = CyclePuzzle failed ayant une Attempt solved ;
- `unresolvedCount` = failed - rescued ;
- `successRate` = solved / (solved + failed) ;
- `progressPercent` = (solved + failed) / total.

Attention : le taux de succès direct n'inclut pas les rattrapages dans le numérateur `solved`. C'est volontaire pour mesurer la réussite sans échec initial.

## Distribution d'essais

Pour chaque puzzle résolu, le reader trouve la tentative solved et incrémente :
- oneAttemptCount ;
- twoAttemptCount ;
- threeAttemptCount ;
- fourPlusAttemptCount.

## Durée

Le CyclePuzzle accumule au minimum la somme des durées d'Attempts. Les merges utilisent des max pour rendre la donnée monotone en présence de sauvegardes concurrentes.

## Idempotence

`clientRequestId` est indexé en base et permet de retrouver une tentative existante. Une requête répétée met à jour la même Attempt au lieu de créer artificiellement une nouvelle tentative.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
