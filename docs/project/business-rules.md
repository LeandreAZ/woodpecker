# Règles métier

## Entraînement

Un `Training` appartient obligatoirement à un `User`. Les ressources dérivées sont protégées par ownership.

Statuts :

`draft`, `active`, `archived`.

## Collection de puzzles

`TrainingPuzzle` associe un `Puzzle` réutilisable à un entraînement :
- position ordonnée ;
- note personnelle éventuelle ;
- appartenance unique à la collection.

Dès qu'un cycle existe, `OwnedTrainingResourceProcessor::preventTrainingPuzzleChangeAfterFirstCycle()` verrouille la liste. Cela garantit que tous les cycles restent comparables sur le même corpus.

## Cycle

Statuts : `planned`, `active`, `completed`.

Un seul cycle `active` peut exister par entraînement. Le processor vérifie cette règle avant persistance.

## CyclePuzzle

Chaque puzzle de la collection est matérialisé dans le cycle par un `CyclePuzzle`.

Statuts : `pending`, `in_progress`, `solved`, `failed`, `skipped`.

## Tentative

Statuts : `in_progress`, `failed`, `solved`.

Une tentative contient :
- numéro ;
- coups joués ;
- erreurs ;
- durée ;
- timestamps ;
- `clientRequestId`.

## Direct / rattrapé / non résolu

### Direct
`CyclePuzzle.status = solved` et aucune tentative `failed`.

### Rattrapé
`CyclePuzzle.status = failed` **et** au moins une tentative `solved`.

Cela peut sembler contre-intuitif : le statut `failed` mémorise le fait que la résolution n'a pas été directe. La présence d'une tentative réussie indique le rattrapage.

### Non résolu
`CyclePuzzle.status = failed` sans tentative `solved`.

## Premier échec

Le frontend signale l'échec d'une tentative, mais permet de continuer le travail. Une nouvelle tentative peut être créée. On ne transforme pas rétroactivement le premier échec en succès.

## Gel

Un `CyclePuzzle` est gelé lorsqu'il est :
- `solved`, ou
- `failed` avec au moins une tentative `solved`.

Une fois gelé, le backend refuse une nouvelle tentative différente.

## Complétion du cycle

`CycleCompletionService` vérifie si un `CyclePuzzle` est terminal, puis si le cycle contient encore un puzzle incomplet. Si aucun ne reste, le cycle passe à `completed`.

## Ownership

Une URL manipulée manuellement ne doit jamais suffire pour lire/modifier la ressource d'un autre utilisateur. Le backend applique le filtre et la vérification : l'UI n'est pas une frontière de sécurité.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
