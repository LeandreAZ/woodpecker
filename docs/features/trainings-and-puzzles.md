# Entraînements et collection de puzzles

## Modèles

- `Training` : configuration et propriétaire ;
- `Puzzle` : définition réutilisable de la position ;
- `TrainingPuzzle` : présence du puzzle dans une collection, ordre et note.

## Création

Le frontend crée un `Training` sans envoyer de propriétaire arbitraire. `TrainingOwnerProcessor` utilise l'utilisateur authentifié.

## Branding

L'entité normalise :
- icône dans une liste autorisée ;
- couleurs hex ;
- fallback historique de logo.

## Collection

`TrainingPuzzle.position` garde l'ordre de résolution.

## Verrouillage

Après existence d'un premier cycle, le processor refuse la modification de la liste TrainingPuzzle. Sans cette règle, le cycle 1 et le cycle 2 pourraient porter sur des corpus différents et les statistiques de progression perdraient leur sens.

## Suppression

Les relations Doctrine `orphanRemoval` permettent de nettoyer les associations enfant lorsqu'un Training est supprimé selon le graphe configuré.

## Import

CSV et Lichess convergent vers `NormalizedPuzzle` puis `TrainingPuzzleImportService`, ce qui évite deux implémentations de persistance différentes.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
