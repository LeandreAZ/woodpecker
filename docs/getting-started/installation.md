# Installation détaillée

## But

L'installation de référence repose sur Docker. Cela évite de demander à chaque développeur d'installer exactement PHP, Composer, PostgreSQL et Node dans les mêmes versions.

## Prérequis

- Git ;
- Docker ;
- Docker Compose ;
- sous Windows : Docker Desktop + WSL2 recommandé.

## Clonage

```bash
git clone <URL_DU_DEPOT>
cd woodpecker
```

`git clone` crée une copie de travail à partir de l'historique distant. Les fichiers ignorés, en particulier `/.env`, les clés JWT, `vendor`, `node_modules` et les volumes PostgreSQL, ne viennent pas du dépôt.

## Créer la configuration locale

Linux/macOS/Git Bash :

```bash
cp .env.example .env
```

PowerShell :

```powershell
Copy-Item .env.example .env
```

Le `.env` racine configure **Compose**, pas directement tous les détails Symfony.

Valeurs de développement typiques :

```dotenv
APP_ENV=dev
APP_PORT=8080
FRONTEND_PORT=5173

POSTGRES_DB=woodpecker
POSTGRES_USER=woodpecker
POSTGRES_PASSWORD=change-me

LICHESS_PUZZLE_DATASET_PATH=/var/www/html/var/data/lichess_db_puzzle.csv
```

## Premier démarrage

```bash
docker compose up -d --build --wait
```

Décomposition :
- `up` crée ou démarre les services ;
- `-d` exécute en arrière-plan ;
- `--build` reconstruit les images locales ;
- `--wait` attend que les healthchecks atteignent un état prêt.

## Ce qui est automatisé

Le conteneur PHP :
1. prépare `vendor` et `config/jwt` ;
2. lance `composer install` lorsque nécessaire ;
3. génère les clés JWT manquantes ;
4. exécute les migrations ;
5. démarre PHP-FPM.

Le conteneur frontend installe ses dépendances si nécessaire puis démarre Vite.

PostgreSQL possède un healthcheck `pg_isready`. PHP dépend de cet état sain, ce qui évite de lancer les migrations contre une base encore indisponible.

## URLs

Par défaut :
- frontend : `http://localhost:5173`
- API : `http://localhost:8080/api`

## Vérifications

```bash
docker compose ps
docker compose logs -f php
docker compose logs -f frontend
```

## Arrêt

```bash
docker compose down
```

## Réinitialisation destructrice

```bash
docker compose down -v
```

`-v` supprime les volumes nommés, donc notamment les données PostgreSQL. Ce n'est pas une simple commande d'arrêt.

## Dataset Lichess

Placer par exemple le CSV dans :

```text
backend/var/data/lichess_db_puzzle.csv
```

Le bind mount `./backend:/var/www/html` rend ce fichier visible côté PHP sous :

```text
/var/www/html/var/data/lichess_db_puzzle.csv
```

Puis :

```bash
docker compose exec php php bin/console app:lichess:sync-catalog
```

## Installation native sans Docker

Elle est possible mais non documentée comme voie principale. Il faudrait reproduire PHP 8.4, extensions PHP, Composer, PostgreSQL 17 et Node 24. Cela accroît le risque de divergence de machine.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
