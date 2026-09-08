# Décisions architecturales

## Frontend/backend séparés

Permet de traiter React comme client API indépendant. Coût : deux environnements et contrat HTTP à maintenir.

## API comme frontière de confiance

React ne possède aucune autorité sur ownership ou validation finale.

## Feature folders frontend

Adoptés après croissance du projet pour réduire les fichiers monolithiques.

## Queries/actions séparées

Les lectures TanStack Query et mutations deviennent plus faciles à localiser/tester.

## ReadModels

Adoptés pour empêcher le frontend de reconstruire les agrégats Stats/History/Detail à partir de nombreuses ressources.

## Catalogue Lichess local

Décision de performance et reproductibilité. Évite un scan massif du CSV à chaque demande.

## E2E isolé

Base/volumes dédiés pour permettre des resets agressifs sans toucher au dev.

## Idempotence Solver

`clientRequestId` est une décision de fiabilité distribuée : les requêtes réseau peuvent être répétées ou arriver dans un ordre inattendu.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
