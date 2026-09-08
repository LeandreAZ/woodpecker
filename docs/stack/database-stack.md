# Stack base de données

## SQL

Langage relationnel utilisé sous Doctrine ou directement via DBAL.

## PostgreSQL 17

Choisi dans les deux Compose.

Atouts pertinents :
- transactions ;
- contraintes ;
- index ;
- tableaux PostgreSQL utiles au catalogue Lichess ;
- requêtes robustes ;
- bonne intégration Doctrine.

## Doctrine ORM

Gère le domaine transactionnel classique.

## DBAL direct

`LichessDatasetProvider` utilise `Connection` et SQL explicite parce que la sélection d'un énorme catalogue filtré n'a pas besoin d'être matérialisée en graphe d'entités Doctrine.

C'est un bon exemple de compromis : utiliser ORM lorsqu'il simplifie, SQL lorsqu'il est plus adapté.

## Index

Un index accélère les recherches au prix :
- d'espace ;
- d'un coût d'écriture ;
- de maintenance.

On indexe donc des colonnes réellement filtrées/jointes, pas « tout ».

## Transaction

Une transaction garantit un ensemble atomique de modifications. Les imports et changements multi-entités doivent préserver la cohérence même en cas d'erreur.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
