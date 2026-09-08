# API Platform dans Woodpecker

## Définition

API Platform construit une API au-dessus des métadonnées PHP : ressources, opérations, groupes de sérialisation et processors.

## Ressources principales

`Training`, `Cycle`, `CyclePuzzle`, `Attempt`, `Puzzle`, `TrainingPuzzle`, `TrainingSession` exposent des opérations standard.

`User` est volontairement restreint : pas de GET collection générique public/privé ; seulement inscription et overview de l'utilisateur courant.

## Sérialisation

Les attributs `#[Groups]` distinguent les champs en lecture/écriture. Cela évite d'exposer automatiquement toute propriété Doctrine.

## Processors

`OwnedTrainingResourceProcessor` encapsule plusieurs ressources liées à un entraînement et :
- vérifie l'utilisateur ;
- vérifie l'ownership ;
- protège la liste après le premier cycle ;
- empêche deux cycles actifs ;
- délègue les `Attempt` au service de lifecycle ;
- synchronise la complétion.

`TrainingOwnerProcessor` attache le propriétaire courant lors de la création d'un Training.

`UserPasswordHasherProcessor` hash le mot de passe avant persistance.

## Endpoints custom

Les écrans complexes utilisent des opérations custom telles que :
- `/api/trainings/dashboard`
- `/api/stats/overview`
- `/api/history/overview`
- `/api/trainings/{id}/overview`
- `/summary`
- `/analytics`
- `/attempt-history`
- `/cycle-history`.

## Alternatives

### Contrôleurs Symfony manuels partout
Plus explicite, mais beaucoup de CRUD/serialization/validation à réécrire.

### GraphQL
Pertinent pour un client qui compose librement des graphes de données, mais ajoute une couche de schéma/résolution inutile pour les écrans très cadrés de Woodpecker.

### API Platform partout sans ReadModels
Simple au début, mais le frontend devrait reconstruire les statistiques et charger de nombreuses relations.

Le compromis choisi est donc : API Platform pour les ressources, endpoints dédiés pour les lectures d'écran.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
