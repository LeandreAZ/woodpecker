# ReadModels

## Pourquoi existent-ils ?

Une entité Doctrine représente surtout une structure persistante. Un écran, lui, a souvent besoin d'un **point de vue calculé** :
- plusieurs tables ;
- statistiques ;
- compteurs ;
- dernières tentatives ;
- deltas entre cycles ;
- données déjà normalisées.

Un ReadModel évite de transformer React en moteur d'agrégation métier.

## Readers actuels

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `HistoryOverviewReader` | `backend/src/ReadModel/HistoryOverviewReader.php` | `__construct()`, `build()` |
| `StatsOverviewReader` | `backend/src/ReadModel/StatsOverviewReader.php` | `__construct()`, `build()` |
| `TrainingAnalyticsReader` | `backend/src/ReadModel/TrainingAnalyticsReader.php` | `__construct()`, `build()` |
| `TrainingAttemptHistoryReader` | `backend/src/ReadModel/TrainingAttemptHistoryReader.php` | `__construct()`, `build()` |
| `TrainingCycleHistoryReader` | `backend/src/ReadModel/TrainingCycleHistoryReader.php` | `__construct()`, `build()` |
| `TrainingOverviewReader` | `backend/src/ReadModel/TrainingOverviewReader.php` | `__construct()`, `build()` |
| `TrainingSummaryReader` | `backend/src/ReadModel/TrainingSummaryReader.php` | `__construct()`, `build()` |

## Rôles

### `TrainingOverviewReader`
Vue riche du Training : collection, cycles, CyclePuzzles, attempts, sessions.

### `TrainingSummaryReader`
Résumé et distributions par cycle. Il distingue notamment :
- solved direct ;
- failed ;
- rescued = failed + présence d'une tentative solved ;
- unresolved = failed - rescued.

La distribution du nombre d'essais classe un puzzle **résolu** selon le numéro de sa tentative `solved` : 1, 2, 3, 4+.

### `TrainingAnalyticsReader`
Indicateurs d'évolution : taux de succès, progrès, volumes, moyennes.

### `TrainingAttemptHistoryReader`
Historique complet des attempts d'un Training.

### `TrainingCycleHistoryReader`
Historique structuré par cycles et CyclePuzzles.

### `StatsOverviewReader`
Agrégation globale sur l'ensemble des trainings possédés par l'utilisateur.

### `HistoryOverviewReader`
Fusionne l'activité de résolution et les événements d'authentification dans une timeline commune.

## ReadModel vs DTO vs Entity

- Entity : modèle persistant ;
- DTO : objet de transfert typé, souvent dédié à une entrée/sortie ;
- ReadModel : modèle de lecture optimisé pour une question/écran.

Ici les readers renvoient principalement des tableaux JSON construits explicitement.

## Compromis

Avantage : frontend simple et cohérence des calculs.
Coût : davantage de code backend et nécessité de maintenir les readers lorsque le domaine change.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
