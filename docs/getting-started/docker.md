# Docker et Compose

## Vocabulaire

### Image
Modèle immuable. Exemples : `postgres:17-alpine`, `nginx:1.28-alpine`.

### Conteneur
Processus isolé créé depuis une image.

### Dockerfile
Recette de construction d'une image personnalisée.

### Volume
Stockage géré par Docker, persistant indépendamment du conteneur.

### Bind mount
Montage direct d'un fichier/dossier de l'hôte.

### Healthcheck
Commande répétée qui détermine si un service est réellement prêt.

### Entrypoint
Programme lancé avant la commande principale d'un conteneur.

## Services de `compose.yaml`

### `database`
- PostgreSQL 17 Alpine ;
- volume `database_data` ;
- healthcheck `pg_isready`.

### `php`
- image construite par `docker/php/Dockerfile` ;
- PHP-FPM 8.4 dans l'image actuelle ;
- monte `backend/` dans `/var/www/html` ;
- volumes séparés pour `vendor` et JWT ;
- dépend de PostgreSQL sain.

### `nginx`
- Nginx 1.28 Alpine ;
- expose `${APP_PORT}:80` ;
- monte le backend en lecture seule ;
- transmet les scripts PHP à `php:9000`.

### `frontend`
- image Node 24 Alpine ;
- monte `frontend/` dans `/app` ;
- volume séparé `frontend_node_modules` ;
- expose Vite.

## Flux réseau

```text
navigateur :5173
  -> Vite
  -> proxy /api
  -> nginx:80
  -> php:9000
  -> Symfony
  -> database:5432
```

Les noms `nginx`, `php`, `database`, `frontend` sont des noms DNS internes au réseau Compose.

## Pourquoi des volumes séparés pour `vendor` et `node_modules` ?

Le code source reste un bind mount éditable depuis l'hôte, tandis que les dépendances Linux restent dans des volumes Docker. Cela évite notamment de mélanger des `node_modules` Windows avec ceux du conteneur Linux.

## Stack E2E

`compose.e2e.yaml` crée :
- une base dédiée `woodpecker_e2e` ;
- ses propres volumes ;
- des uploads isolés ;
- ses propres clés JWT ;
- un runner Playwright Chromium ;
- ports liés à `127.0.0.1` seulement.

L'objectif est qu'un test destructif n'utilise jamais les données de développement.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
