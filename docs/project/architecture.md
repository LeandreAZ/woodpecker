# Architecture générale

## Schéma

```text
Browser
  |
  | React + TypeScript
  | TanStack Query
  v
Vite (dev)
  |
  | /api proxy
  v
Nginx
  |
  | FastCGI
  v
PHP-FPM
  |
  v
Symfony 7.4 / API Platform 4.3
  |
  | Doctrine ORM / DBAL
  v
PostgreSQL 17
```

## Architecture client/serveur

Le frontend n'accède jamais directement à PostgreSQL. Il appelle l'API HTTP. Cette frontière :
- protège la base ;
- centralise les règles métier ;
- permet de contrôler l'ownership ;
- découple l'UI de la persistance.

## Deux styles backend complémentaires

### Ressources API Platform
Entités comme `Training`, `Cycle`, `CyclePuzzle`, `Attempt` bénéficient d'opérations standard et de processors.

### Endpoints ReadModel/custom
Les écrans Dashboard, History, Statistics et Training Detail ont besoin d'agrégats qui ne correspondent pas à une seule ligne de table. Ils passent par des readers dédiés.

Readers actuels :

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `HistoryOverviewReader` | `backend/src/ReadModel/HistoryOverviewReader.php` | `__construct()`, `build()` |
| `StatsOverviewReader` | `backend/src/ReadModel/StatsOverviewReader.php` | `__construct()`, `build()` |
| `TrainingAnalyticsReader` | `backend/src/ReadModel/TrainingAnalyticsReader.php` | `__construct()`, `build()` |
| `TrainingAttemptHistoryReader` | `backend/src/ReadModel/TrainingAttemptHistoryReader.php` | `__construct()`, `build()` |
| `TrainingCycleHistoryReader` | `backend/src/ReadModel/TrainingCycleHistoryReader.php` | `__construct()`, `build()` |
| `TrainingOverviewReader` | `backend/src/ReadModel/TrainingOverviewReader.php` | `__construct()`, `build()` |
| `TrainingSummaryReader` | `backend/src/ReadModel/TrainingSummaryReader.php` | `__construct()`, `build()` |

## Pourquoi cette combinaison ?

Exposer tout le graphe Doctrine brut ferait porter trop de calcul au frontend et créerait des appels en cascade. À l'inverse, écrire manuellement tous les CRUD supprimerait une partie du gain d'API Platform. Woodpecker utilise donc chaque approche là où elle est adaptée.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
