# Ownership et autorisation

## Problème

Masquer un bouton dans React ne protège rien : un utilisateur peut appeler directement `/api/trainings/123`.

La règle de propriété doit donc être imposée **dans l'API**.

## Lecture

`CurrentUserTrainingScopeExtension` étend les queries API Platform afin de restreindre automatiquement les ressources liées à des entraînements du user courant.

Pour les endpoints custom, les contrôleurs récupèrent le Training avec des méthodes du type `findOneOwnedByUser()`.

## Écriture

`OwnedTrainingResourceProcessor` obtient le user courant puis appelle `TrainingOwnershipChecker`.

Il protège les ressources dont la propriété remonte par :
- Training ;
- TrainingPuzzle ;
- Cycle ;
- CyclePuzzle ;
- TrainingSession ;
- Attempt.

## Création Training

`TrainingOwnerProcessor` affecte explicitement le propriétaire courant.

## Pourquoi plusieurs mécanismes ?

Une extension Doctrine est adaptée au filtrage des lectures génériques. Un processor est adapté aux mutations. Un endpoint custom doit vérifier explicitement son contexte.

## Effet attendu

Pour un ID appartenant à un autre user, l'API ne doit pas fournir une porte latérale permettant lecture ou modification.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
