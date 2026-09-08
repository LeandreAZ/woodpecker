# Woodpecker Trainer

Woodpecker Trainer est une application web full-stack dédiée à l'entraînement tactique aux échecs selon le principe de la **Woodpecker Method**.

L'objectif est de travailler plusieurs fois un même ensemble de puzzles au cours de cycles successifs afin de mesurer la progression, réduire les erreurs et améliorer la rapidité de résolution.

Le projet permet de créer ses propres entraînements, d'y importer ou générer des puzzles, de les résoudre sur un véritable échiquier interactif et d'analyser ensuite précisément ses performances.

> Projet développé comme application complète d'apprentissage et de mise en pratique d'une architecture moderne React / Symfony / PostgreSQL / Docker.

---

## Fonctionnalités

### Compte utilisateur

* inscription ;
* connexion par JWT ;
* déconnexion ;
* modification des informations du compte ;
* préférences utilisateur ;
* avatar ;
* isolation des données entre utilisateurs.

### Entraînements

Un utilisateur peut créer plusieurs entraînements Woodpecker indépendants.

Chaque entraînement peut notamment posséder :

* un nom ;
* une description ;
* une identité visuelle ;
* une collection de puzzles ;
* plusieurs cycles successifs ;
* son historique ;
* ses statistiques.

Les entraînements peuvent être créés, consultés, modifiés et supprimés depuis l'interface.

### Import de puzzles

Deux parcours principaux sont disponibles.

#### CSV

L'application peut analyser un fichier CSV avant son import.

L'analyse distingue notamment :

* lignes valides ;
* lignes invalides ;
* doublons ;
* puzzles réellement importables.

L'import est ensuite effectué à partir de l'analyse validée.

#### Catalogue Lichess

Woodpecker peut travailler avec un catalogue local issu de la base de puzzles Lichess.

Les puzzles peuvent être sélectionnés selon plusieurs critères, notamment :

* quantité ;
* difficulté ;
* thèmes ;
* répartition des thèmes ;
* nombre de coups.

Le catalogue est synchronisé dans PostgreSQL afin d'éviter de parcourir l'intégralité du fichier source à chaque génération.

### Solver

Le Solver utilise un échiquier interactif pour jouer réellement les coups du puzzle.

Le projet distingue précisément :

* un **coup** joué sur l'échiquier ;
* une **tentative** complète de résolution ;
* le résultat officiel du puzzle dans son cycle.

Une première erreur fait considérer le puzzle comme raté pour le cycle concerné, mais le joueur peut continuer à chercher la solution.

Cela permet notamment de distinguer :

* **réussi directement** : résolution sans erreur ;
* **rattrapé / finalement résolu** : au moins une erreur, puis résolution ;
* **non résolu** : puzzle abandonné ou non terminé correctement.

Les tentatives successives sont conservées afin de produire un historique et des statistiques détaillés.

### Cycles Woodpecker

Une même collection de puzzles peut être rejouée au cours de plusieurs cycles.

Le projet conserve les résultats de chaque cycle indépendamment afin de mesurer l'évolution de la résolution au fil des répétitions.

### Historique

L'historique permet de retrouver les tentatives effectuées et leur contexte :

* entraînement ;
* cycle ;
* puzzle ;
* numéro de tentative ;
* résultat ;
* date ;
* durée ;
* informations liées à la résolution.

### Statistiques

Les statistiques agrègent les résultats enregistrés dans les entraînements.

Elles permettent notamment d'observer :

* les réussites directes ;
* les puzzles rattrapés après erreur ;
* les puzzles non résolus ;
* la progression par cycle ;
* la distribution du nombre de tentatives ;
* différentes métriques globales et propres à un entraînement.

---

# Pages principales

Le frontend possède son propre système de routing basé sur l'History API du navigateur.

Les principales routes sont :

| Route                   | Page                             |
| ----------------------- | -------------------------------- |
| `/auth`                 | inscription / connexion          |
| `/dashboard`            | tableau de bord et entraînements |
| `/trainings/new`        | création d'un entraînement       |
| `/trainings/:id`        | détail d'un entraînement         |
| `/trainings/:id/edit`   | modification                     |
| `/trainings/:id/import` | import/génération de puzzles     |
| `/trainings/:id/solver` | résolution des puzzles           |
| `/stats`                | statistiques                     |
| `/history`              | historique                       |
| `/settings`             | compte et préférences            |

La racine `/` redirige logiquement vers le tableau de bord de l'application.

---

# Stack technique

## Backend

* **PHP 8.4**
* **Symfony 7.4**
* **API Platform 4.3**
* **Doctrine ORM 3.6**
* **Doctrine Migrations**
* **LexikJWTAuthenticationBundle 3.2**
* **NelmioCorsBundle**
* **PostgreSQL 17**

Le backend gère notamment :

* authentification ;
* persistance ;
* règles métier ;
* ownership des ressources ;
* imports ;
* cycles ;
* tentatives ;
* statistiques ;
* historiques ;
* ReadModels dédiés aux vues complexes.

## Frontend

* **React 19**
* **TypeScript**
* **Vite 7**
* **TanStack Query 5**
* **chess.js**
* **react-chessboard**
* **Lucide React**

TanStack Query centralise principalement les données serveur, leur chargement et leur invalidation après mutations.

`chess.js` assure la logique échiquéenne nécessaire à la validation des positions et des coups tandis que `react-chessboard` fournit l'échiquier interactif.

## Infrastructure

* **Docker**
* **Docker Compose**
* **Nginx 1.28 Alpine**
* **PHP-FPM**
* **Node.js 24 Alpine**
* **PostgreSQL 17 Alpine**

L'environnement principal est composé de quatre services :

```text
frontend
   |
   v
 nginx
   |
   v
 php
   |
   v
database
```

Docker permet de lancer le projet sans installer directement PHP, Composer, PostgreSQL ou Node.js avec les versions exactes utilisées par l'application.

---

# Arborescence générale

```text
woodpecker/
├── backend/              # API Symfony et domaine métier
│   ├── config/
│   ├── migrations/
│   ├── public/
│   ├── src/
│   └── tests/
│
├── frontend/             # application React / TypeScript
│   ├── e2e/
│   ├── public/
│   ├── scripts/
│   └── src/
│
├── docker/               # images et configuration des conteneurs
│   ├── e2e/
│   ├── frontend/
│   ├── nginx/
│   └── php/
│
├── docs/                 # documentation, tests et références
├── scripts/              # scripts utilitaires
├── compose.yaml          # environnement de développement
├── compose.e2e.yaml      # environnement E2E isolé
└── .env.example          # exemple de configuration Docker
```

Une documentation beaucoup plus détaillée de l'architecture et des choix techniques est disponible dans `docs/`.

---

# Installation

## Prérequis

La manière recommandée de lancer Woodpecker est Docker.

Il faut disposer de :

* Git ;
* Docker ;
* Docker Compose.

Sous Windows, Docker Desktop avec WSL2 est recommandé.

---

## 1. Cloner le dépôt

```bash
git clone <URL_DU_DEPOT>
cd woodpecker
```

---

## 2. Créer la configuration locale

Copier le fichier d'exemple :

### Linux / macOS / Git Bash

```bash
cp .env.example .env
```

### PowerShell

```powershell
Copy-Item .env.example .env
```

Le fichier `.env` racine configure principalement Docker Compose.

Exemple :

```dotenv
APP_ENV=dev
APP_PORT=8080
FRONTEND_PORT=5173

POSTGRES_DB=woodpecker
POSTGRES_USER=woodpecker
POSTGRES_PASSWORD=change-me

LICHESS_PUZZLE_DATASET_PATH=/var/www/html/var/data/lichess_db_puzzle.csv
```

Le mot de passe PostgreSQL peut être changé pour l'environnement local.

`LICHESS_PUZZLE_DATASET_PATH` n'est nécessaire que pour synchroniser un catalogue local de puzzles Lichess.

Le fichier `.env` personnel n'est pas destiné à être ajouté à Git.

---

## 3. Construire et démarrer l'application

```bash
docker compose up -d --build --wait
```

Au premier démarrage, les conteneurs prennent automatiquement en charge plusieurs opérations :

* installation des dépendances Composer si nécessaire ;
* génération de la paire de clés JWT si absente ;
* application des migrations Doctrine ;
* installation des dépendances npm si nécessaire ;
* lancement du frontend Vite.

---

## 4. Accéder à l'application

Frontend :

```text
http://localhost:5173
```

API :

```text
http://localhost:8080/api
```

Les ports peuvent être modifiés via :

```dotenv
APP_PORT=
FRONTEND_PORT=
```

dans le `.env` racine.

---

# Configuration des environnements

Le projet sépare volontairement les variables selon la couche concernée.

```text
.env
.env.example

backend/.env
backend/.env.test

frontend/.env.example
```

### `.env.example`

Modèle public de configuration Docker.

### `.env`

Copie locale de `.env.example`.

Elle contient les paramètres propres à la machine du développeur et n'est pas suivie par Git.

### `backend/.env`

Valeurs par défaut utilisées par Symfony.

Il contient notamment les paramètres relatifs à :

* environnement Symfony ;
* secret de développement ;
* Doctrine ;
* CORS ;
* JWT ;
* génération d'URL ;
* stockage partagé.

Docker surcharge certaines de ces valeurs au démarrage du conteneur.

Par exemple, `compose.yaml` fournit directement à Symfony une `DATABASE_URL` construite à partir des paramètres PostgreSQL du `.env` racine.

### `backend/.env.test`

Variables propres aux tests backend.

### `frontend/.env.example`

Exemple de configuration Vite :

```dotenv
VITE_API_BASE_URL=/api
```

Le frontend utilise également `/api` comme valeur par défaut si cette variable n'est pas fournie.

La documentation détaillée de chaque variable et de son fonctionnement est disponible dans [Variables d'environnement](docs/getting-started/environment-variables.md).

---

# Base de données

Le projet utilise PostgreSQL 17.

La base principale est définie à partir de :

```dotenv
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
```

Docker Compose construit ensuite la variable `DATABASE_URL` transmise au backend Symfony.

Les migrations sont automatiquement exécutées au démarrage du conteneur PHP.

Elles peuvent également être lancées manuellement :

```bash
docker compose exec php php bin/console doctrine:migrations:migrate
```

Afficher l'état des migrations :

```bash
docker compose exec php php bin/console doctrine:migrations:status
```

---

# Catalogue de puzzles Lichess

Woodpecker peut utiliser localement le dataset officiel de puzzles Lichess.

Placer par exemple le CSV dans `backend/var/data/`, afin qu’il soit accessible au conteneur PHP, puis définir :

```dotenv
LICHESS_PUZZLE_DATASET_PATH=/var/www/html/var/data/lichess_db_puzzle.csv
```

La synchronisation du catalogue PostgreSQL est réalisée avec :

```bash
docker compose exec php php bin/console app:lichess:sync-catalog
```

Pour remplacer complètement le catalogue existant :

```bash
docker compose exec php php bin/console app:lichess:sync-catalog --truncate
```

Il est également possible de fournir explicitement un fichier :

```bash
docker compose exec php php bin/console app:lichess:sync-catalog --file=/chemin/dans/le/conteneur/lichess_db_puzzle.csv
```

> Le chemin doit être accessible depuis le conteneur PHP, pas uniquement depuis le système hôte.

---

# Commandes Docker utiles

Démarrer :

```bash
docker compose up -d --wait
```

Reconstruire les images :

```bash
docker compose up -d --build --wait
```

Afficher les services :

```bash
docker compose ps
```

Afficher les logs :

```bash
docker compose logs
```

Suivre les logs :

```bash
docker compose logs -f
```

Logs d'un service précis :

```bash
docker compose logs -f php
docker compose logs -f frontend
docker compose logs -f nginx
docker compose logs -f database
```

Redémarrer le frontend :

```bash
docker compose restart frontend
```

Arrêter le projet :

```bash
docker compose down
```

Supprimer également les volumes et donc les données locales :

```bash
docker compose down -v
```

> `docker compose down -v` supprime notamment la base PostgreSQL locale. À utiliser volontairement.

---

# Commandes Symfony utiles

Afficher les informations Symfony :

```bash
docker compose exec php php bin/console about
```

Lister les commandes :

```bash
docker compose exec php php bin/console list
```

Vider le cache :

```bash
docker compose exec php php bin/console cache:clear
```

Afficher les routes :

```bash
docker compose exec php php bin/console debug:router
```

Afficher les services :

```bash
docker compose exec php php bin/console debug:container
```

État des migrations :

```bash
docker compose exec php php bin/console doctrine:migrations:status
```

Exécuter les migrations :

```bash
docker compose exec php php bin/console doctrine:migrations:migrate
```

---

# Commandes frontend

Les commandes npm sont exécutées dans le conteneur `frontend`.

Mode développement :

```bash
docker compose exec frontend npm run dev
```

Lint :

```bash
docker compose exec frontend npm run lint
```

Tests :

```bash
docker compose exec frontend npm test
```

Build de production :

```bash
docker compose exec frontend npm run build
```

Vérification des exports relatifs :

```bash
docker compose exec frontend npm run check:exports
```

---

# Tests backend

Les tests backend utilisent PHPUnit.

```bash
docker compose exec php php bin/phpunit
```

La suite actuellement validée comporte :

```text
95 tests
694 assertions
```

---

# Tests frontend

Les tests frontend utilisent Vitest et Testing Library.

```bash
docker compose exec frontend npm test
```

La suite actuellement validée comporte :

```text
114 tests
```

---

# Tests End-to-End Playwright

Les tests E2E disposent de leur propre environnement Docker :

```text
compose.e2e.yaml
```

Cet environnement utilise notamment :

* une base PostgreSQL dédiée `woodpecker_e2e` ;
* des volumes dédiés ;
* des utilisateurs de test ;
* un reset protégé ;
* Chromium via Playwright.

Lancer toute la campagne :

```bash
cd frontend
npm run e2e
```

Depuis la racine, l'équivalent est :

```bash
npm --prefix frontend run e2e
```

Smoke E2E :

```bash
npm --prefix frontend run e2e:smoke
```

Mode headed :

```bash
npm --prefix frontend run e2e:headed
```

Interface Playwright :

```bash
npm --prefix frontend run e2e:ui
```

Rapport Playwright :

```bash
npm --prefix frontend run e2e:report
```

La campagne finale validée contient :

```text
13 / 13 scénarios E2E réussis
```

Le reset E2E est volontairement protégé et refuse de fonctionner s'il ne détecte pas :

* un environnement `dev` ou `test` ;
* `WOODPECKER_E2E=1` ;
* la base exacte `woodpecker_e2e`.

---

# Smoke test global

Un script PowerShell permet d'effectuer plusieurs vérifications rapides :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke/smoke-test.ps1
```

Il vérifie notamment :

* l'état Docker Compose ;
* certaines syntaxes PHP ;
* le lint frontend ;
* le build frontend ;
* une partie du schéma PostgreSQL ;
* la disponibilité HTTP de l'API ;
* la disponibilité HTTP du frontend.

---

# Authentification API

L'inscription utilise :

```text
POST /api/users
```

La connexion utilise :

```text
POST /api/login_check
```

Une requête authentifiée doit ensuite envoyer le JWT :

```http
Authorization: Bearer <token>
```

Les ressources appartenant à un utilisateur sont filtrées et protégées côté backend.

Le frontend n'a donc pas à faire confiance uniquement à l'affichage pour empêcher l'accès aux données d'un autre utilisateur.

---

# Tests et qualité de la version 1.0.0

État de la dernière certification complète :

| Vérification                |                    Résultat |
| --------------------------- | --------------------------: |
| Playwright                  |                     13 / 13 |
| Tests frontend              |                         114 |
| Tests backend               |                          95 |
| Assertions backend          |                         694 |
| ESLint                      |                    0 erreur |
| Build frontend              |                          OK |
| Dépréciations backend       |                           0 |
| npm audit                   | aucune vulnérabilité connue |
| Composer audit              | aucune vulnérabilité connue |
| Docker / smoke / HTTP / SQL |                          OK |

---

# Documentation

La [documentation technique complète](docs/README.md) présente en détail l'architecture, le fonctionnement et la maintenance du projet.

L'objectif de cette documentation est de permettre à une personne qui ne connaît pas le code de comprendre puis reprendre Woodpecker sans dépendre de son auteur initial.

Elle couvre notamment :

* architecture générale ;
* backend ;
* frontend ;
* base de données ;
* API ;
* Docker et infrastructure ;
* variables d'environnement ;
* authentification ;
* entraînements ;
* cycles ;
* Solver ;
* tentatives ;
* History ;
* Statistics ;
* import CSV ;
* catalogue Lichess ;
* tests ;
* décisions d'architecture ;
* choix des bibliothèques ;
* alternatives envisagées ;
* limites connues ;
* pistes d'amélioration ;
* maintenance.

---

# Limites et évolutions possibles

La version `1.0.0` constitue une base fonctionnelle complète, mais plusieurs améliorations peuvent être envisagées pour une évolution future, notamment :

* durcissement de la configuration de production ;
* stratégie JWT plus adaptée à un déploiement public ;
* limitation des tentatives de connexion ;
* headers HTTP/CSP renforcés ;
* optimisation du bundle frontend ;
* optimisation de l'image Docker frontend ;
* utilisation plus stricte de `npm ci` dans certains contextes ;
* réduction des warnings ESLint restants ;
* approfondissement de la supervision et de l'observabilité ;
* nouvelles analyses échiquéennes ;
* intégrations externes supplémentaires.

Ces éléments ne bloquent pas le fonctionnement de la version actuelle et sont documentés comme pistes d'évolution plutôt que comme fonctionnalités incomplètes.

---

# Arrêter ou réinitialiser le projet

Arrêt simple :

```bash
docker compose down
```

Réinitialisation complète des volumes locaux :

```bash
docker compose down -v
```

Puis reconstruction :

```bash
docker compose up -d --build --wait
```

---

# Version

Version actuelle :

```text
1.0.0
```

---

# Licence / contexte

Woodpecker Trainer est un projet personnel et académique réalisé afin de concevoir une application web complète autour d'un besoin concret : l'entraînement tactique répétitif aux échecs.

Le projet sert également de support d'apprentissage pour :

* architecture full-stack ;
* conception d'API ;
* modélisation relationnelle ;
* React et TypeScript ;
* Symfony et Doctrine ;
* Docker ;
* authentification ;
* tests unitaires, d'intégration et E2E ;
* gestion de données et statistiques ;
* maintenance d'une application de taille significative.
