# Cycles Woodpecker

## Concept

Un cycle est une répétition complète de la collection d'un Training.

## Modèle

`Cycle` porte :
- numéro ;
- statut planned/active/completed ;
- dates ;
- Training parent.

`CyclePuzzle` matérialise chaque TrainingPuzzle dans ce cycle.

## Un seul cycle actif

Le processor appelle `CycleRepository::hasActiveCycleForTraining()` et rejette un second cycle actif avec conflit HTTP.

## Terminalité

Un CyclePuzzle terminal est :
- `solved`, ou
- `failed` avec une Attempt solved.

Le second cas correspond au rattrapage.

## Fin automatique

`CycleCompletionService` demande au repository s'il reste un CyclePuzzle incomplet. S'il n'en reste aucun :
- status `completed` ;
- `completedAt` fixé.

## Pourquoi ne pas juste compter les Attempts ?

Le CyclePuzzle possède l'état agrégé de la position dans le cycle. Cela simplifie les queries de progression et permet de distinguer essai individuel et résultat global.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
