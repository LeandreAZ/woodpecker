# Services et logique métier

| Classe | Fichier | Méthodes publiques importantes |
|---|---|---|
| `AuthenticationEventRecorder` | `backend/src/Service/AuthenticationEventRecorder.php` | `__construct()`, `record()` |
| `CycleCompletionService` | `backend/src/Service/CycleCompletionService.php` | `__construct()`, `synchronizeCyclePuzzleState()` |
| `SolverAttemptLifecycleService` | `backend/src/Service/SolverAttemptLifecycleService.php` | `__construct()`, `persistAttempt()` |
| `UserPreferenceManager` | `backend/src/Service/UserPreferenceManager.php` | `__construct()`, `getOrCreate()` |

## `SolverAttemptLifecycleService`

Cœur de la persistance Solver. Il :
1. tente de retrouver une tentative par `clientRequestId` ;
2. à défaut, peut retrouver la tentative active du même `CyclePuzzle` ;
3. refuse une écriture sur un puzzle gelé ;
4. initialise ou fusionne l'Attempt ;
5. flush ;
6. recalcule l'agrégat du CyclePuzzle ;
7. synchronise la fin éventuelle du cycle.

La fusion est **monotone** :
- garde la liste de coups la plus longue ;
- garde la durée maximale ;
- garde le nombre d'erreurs maximal ;
- ne fait pas revenir une tentative terminale vers `in_progress`.

## `CycleCompletionService`

Détermine si un CyclePuzzle est terminal puis si le cycle entier est terminé.

## `AuthenticationEventRecorder`

Enregistre login/logout et extrait contexte navigateur/appareil ainsi qu'un fingerprint du bearer token lorsque disponible.

## `UserPreferenceManager`

Récupère ou crée les préférences, afin que les contrôleurs n'aient pas à répéter ce comportement.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
