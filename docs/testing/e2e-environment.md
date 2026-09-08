# Environnement Docker E2E

## Isolation

`compose.e2e.yaml` crée le projet Compose `woodpecker-e2e`.

Base :
- nom exact `woodpecker_e2e` ;
- credentials dédiés ;
- volume dédié.

Autres volumes isolés :
- vendor ;
- JWT ;
- var ;
- uploads ;
- node_modules.

## Ports

- Nginx : `127.0.0.1:8088`
- frontend : `127.0.0.1:5183`

La liaison loopback évite une exposition réseau inutile.

## Runner

`docker/e2e/Dockerfile` fournit Playwright/Chromium.

`E2E_BASE_URL=http://frontend:5173` utilise le réseau Compose.

## Reset protégé

`app:e2e:reset` doit refuser toute exécution si les garde-fous ne correspondent pas.

Cette protection est une contrainte de sécurité de développement : un test ne doit jamais pouvoir effacer la base courante par une simple erreur de variable.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
