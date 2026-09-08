# Alternatives et compromis

## API Platform

**Gain** : CRUD, serialization, validation, conventions.
**Coût** : magie/abstraction ; les processors et extensions demandent de comprendre le pipeline.
**Alternative meilleure si** : API très spécifique avec peu de CRUD -> contrôleurs explicites.

## Doctrine ORM

**Gain** : modèle relationnel objet, Unit of Work.
**Coût** : risque de requêtes implicites, nécessité de connaître l'ORM.
**Alternative meilleure si** : lecture analytique massive -> SQL/DBAL, comme le catalogue Lichess.

## TanStack Query

**Gain** : état serveur robuste.
**Coût** : apprendre query keys/invalidation.
**Alternative meilleure si** : petit formulaire avec un seul fetch sans cache -> fetch simple peut suffire.

## Routeur maison

**Gain** : très léger et compréhensible.
**Coût** : réimplémenter progressivement des fonctions de routeur.
**Alternative meilleure si** : routes imbriquées, loaders, navigation complexe -> React Router/TanStack Router.

## JWT localStorage

**Gain** : simple pour client API.
**Coût** : token accessible au JS en cas de XSS.
**Alternative** : cookies HttpOnly + stratégie CSRF adaptée.

## Docker dev

**Gain** : environnement reproductible.
**Coût** : volumes/réseau/permissions ajoutent une couche à apprendre.
**Alternative** : installation native pour un développeur seul maîtrisant exactement sa machine.

## ReadModels

**Gain** : écrans rapides et contrats clairs.
**Coût** : duplication contrôlée de notions entre readers.
**Alternative** : GraphQL ou API générique si les clients avaient des besoins très variés.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
