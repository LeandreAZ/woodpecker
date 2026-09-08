# Choix technologiques comparés

| Besoin | Choix | Alternatives | Pourquoi raisonnable ici |
|---|---|---|---|
| UI | React | Vue, Angular, Svelte | écosystème, composants, hooks |
| backend | Symfony | Laravel, Nest, FastAPI | structure, Doctrine, Security |
| API | API Platform + custom | REST manuel, GraphQL | CRUD rapide + lectures dédiées |
| DB | PostgreSQL | MySQL, SQLite | index, tableaux, robustesse |
| server state | TanStack Query | SWR, RTK Query, fetch manuel | mutations/cache/invalidation |
| auth | JWT | session cookie | séparation API/client simple |
| infra dev | Docker Compose | installation native | reproductibilité |
| E2E | Playwright | Cypress | Chromium moderne, runner robuste |

## React vs Vue

Vue aurait très bien pu convenir. Le choix React n'est pas une nécessité métier : il devient pertinent parce que le projet utilise déjà React, TanStack Query et react-chessboard.

## Symfony vs Laravel

Laravel simplifie beaucoup d'usages web standards. Symfony expose davantage de composants et de configuration ; ici c'est utile pour un projet académique/portfolio qui montre Security, DI, Doctrine, console et architecture.

## PostgreSQL vs SQLite

SQLite est excellent pour une app locale/simple. Le catalogue Lichess, la concurrence et les filtres/index rendent PostgreSQL plus approprié.

## JWT vs session

JWT s'intègre naturellement à une API stateless. Une session cookie pourrait cependant être plus simple et plus sûre côté navigateur dans certaines architectures monolithiques.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
