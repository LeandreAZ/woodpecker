# Variables d'environnement

## Principe

Une variable d'environnement fournit une configuration à un processus sans modifier le code. Dans Woodpecker, elles servent à la machine, au réseau, à la base, aux clés et à l'environnement d'exécution.

## `APP_ENV`

- exemple : `dev` ;
- défini dans le `.env` racine et/ou l'environnement PHP ;
- lu par Symfony ;
- sélectionne notamment les blocs `when@dev`, `when@test`, `when@prod`.

`APP_ENV=prod` ne suffit pas à rendre l'infrastructure prête pour la production.

## `APP_PORT`

- défaut : `8080` ;
- utilisé par Compose dans `${APP_PORT:-8080}:80` ;
- partie gauche : port de l'hôte ;
- partie droite : port Nginx dans le conteneur.

## `FRONTEND_PORT`

- défaut : `5173` ;
- expose Vite sur la machine.

## `POSTGRES_DB`

Nom de la base créée par l'image PostgreSQL lors de l'initialisation du volume.

## `POSTGRES_USER`

Compte PostgreSQL créé/utilisé par le conteneur.

## `POSTGRES_PASSWORD`

Mot de passe PostgreSQL de l'environnement local. Une production devrait l'injecter depuis un secret externe.

## `DATABASE_URL`

Compose construit actuellement :

```text
postgresql://USER:PASSWORD@database:5432/DB?serverVersion=17&charset=utf8
```

Décomposition :
- `postgresql` : driver ;
- `USER:PASSWORD` : authentification ;
- `database` : hostname Docker ;
- `5432` : port interne PostgreSQL ;
- `DB` : base ;
- `serverVersion=17` : version connue de Doctrine ;
- `charset=utf8` : encodage.

Pourquoi `database` et pas `localhost` ? Dans le conteneur PHP, `localhost` désigne le conteneur PHP. Compose fournit un DNS privé où le nom du service `database` résout l'IP du conteneur PostgreSQL.

## `APP_SECRET`

Secret Symfony. La valeur committée est volontairement générique pour le développement.

## `APP_SHARE_DIR`

Valeur Symfony utilisée comme emplacement partagé de l'application. Le projet utilise en particulier un pool cache filesystem pour conserver l'analyse CSV sur plusieurs requêtes HTTP.

## `DEFAULT_URI`

URL de base utilisée lorsque Symfony doit générer des URL hors requête HTTP, par exemple dans certaines commandes.

## `CORS_ALLOW_ORIGIN`

Expression de configuration NelmioCors autorisant les origines localhost/127.0.0.1 en développement.

## `JWT_SECRET_KEY`

Chemin vers `config/jwt/private.pem`. La clé privée signe les tokens.

## `JWT_PUBLIC_KEY`

Chemin vers `config/jwt/public.pem`. La clé publique vérifie les tokens.

## `JWT_PASSPHRASE`

Phrase de passe éventuelle protégeant la clé privée. Vide dans l'environnement de développement actuel.

## `VITE_API_BASE_URL`

- exemple : `/api` ;
- lue côté frontend ;
- fallback identique dans `frontend/src/shared/api/client.ts`.

Toute variable `VITE_*` est potentiellement intégrée au bundle livré au navigateur : **ne jamais y mettre de secret**.

## `LICHESS_PUZZLE_DATASET_PATH`

Valeur exemple :

```text
/var/www/html/var/data/lichess_db_puzzle.csv
```

C'est un chemin **dans le conteneur PHP**. Grâce au bind mount `./backend:/var/www/html`, le fichier hôte `backend/var/data/lichess_db_puzzle.csv` devient accessible à ce chemin.

## `WOODPECKER_E2E`

Drapeau explicite imposé par `app:e2e:reset`. La commande refuse l'opération si le contexte attendu n'est pas vérifié, notamment la base `woodpecker_e2e`.

## `E2E_BASE_URL`

Fournie au runner Playwright dans `compose.e2e.yaml`. Le runner utilise le DNS Compose `frontend` plutôt qu'un port localhost.

## `KERNEL_CLASS`

Dans `backend/.env.test`, indique le Kernel Symfony utilisé par les tests.

## Pourquoi ne pas hardcoder ?

Les valeurs d'infrastructure changent selon :
- machine ;
- CI ;
- E2E ;
- production ;
- ports ;
- credentials.

Le code métier ne doit pas être réécrit pour chacun de ces environnements.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
