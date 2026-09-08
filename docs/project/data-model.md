# Modèle de données

## Relations principales

```text
User
 ├─ 1:1 UserPreference
 └─ 1:N Training
       ├─ 1:N TrainingPuzzle ─ N:1 Puzzle
       │      └─ 1:N CyclePuzzle
       ├─ 1:N Cycle
       │      └─ 1:N CyclePuzzle
       └─ 1:N TrainingSession
              └─ 1:N Attempt
                     └─ N:1 CyclePuzzle

User
 └─ 1:N AuthenticationEvent
```

`CyclePuzzle` est la jonction temporelle : il répond à « ce puzzle de cet entraînement dans ce cycle précis ».

`Attempt` répond à « cet essai précis effectué dans une session sur ce CyclePuzzle ».

La colonne « Nullable PHP » décrit le type de la propriété dans l'entité, notamment avant sa première persistance. La nullabilité SQL et les relations obligatoires restent définies par les attributs Doctrine et les migrations.


## `User`

Fichier : `backend/src/Entity/User.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `email` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `pseudonym` | `string` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `avatarUrl` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `roles` | `array` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `password` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `plainPassword` | `?string` | — | oui | Valeur transitoire utilisée pour la validation et le hash du mot de passe ; elle n'est pas persistée. |
| `createdAt` | `?\DateTimeImmutable` | — | oui | Date de création persistée. |
| `updatedAt` | `?\DateTimeImmutable` | — | oui | Dernière modification. |
| `trainings` | `Collection` | OneToMany → Training | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `preference` | `?UserPreference` | OneToOne → UserPreference | oui | Donnée persistée utilisée par le domaine ou l'interface. |

Méthodes publiques notables : `__construct()`, `getId()`, `getEmail()`, `setEmail()`, `getUserIdentifier()`, `getPseudonym()`, `setPseudonym()`, `ensureDefaultPseudonym()`, `getAvatarUrl()`, `setAvatarUrl()`, `getRoles()`, `setRoles()`, `getPassword()`, `setPassword()`, `getPlainPassword()`, `setPlainPassword()`, `eraseCredentials()`, `getCreatedAt()`.


## `UserPreference`

Fichier : `backend/src/Entity/UserPreference.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `user` | `?User` | OneToOne → User | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `displayName` | `string` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `language` | `string` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `theme` | `string` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `boardLightSquare` | `string` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `boardDarkSquare` | `string` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `showLegalMoves` | `bool` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `showCoordinates` | `bool` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `animateMoves` | `bool` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `showRightClickTargets` | `bool` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `createdAt` | `?\DateTimeImmutable` | — | oui | Date de création persistée. |
| `updatedAt` | `?\DateTimeImmutable` | — | oui | Dernière modification. |

Méthodes publiques notables : `getId()`, `getUser()`, `setUser()`, `getDisplayName()`, `setDisplayName()`, `getLanguage()`, `setLanguage()`, `getTheme()`, `setTheme()`, `getBoardLightSquare()`, `setBoardLightSquare()`, `getBoardDarkSquare()`, `setBoardDarkSquare()`, `shouldShowLegalMoves()`, `setShowLegalMoves()`, `shouldShowCoordinates()`, `setShowCoordinates()`, `shouldAnimateMoves()`.


## `Training`

Fichier : `backend/src/Entity/Training.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `name` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `description` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `icon` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `iconBackgroundColor` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `iconColor` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `logo` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `status` | `TrainingStatus` | — | non | État métier contrôlé par un enum. |
| `mistakeLimit` | `int` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `createdAt` | `?\DateTimeImmutable` | — | oui | Date de création persistée. |
| `updatedAt` | `?\DateTimeImmutable` | — | oui | Dernière modification. |
| `firstCycleStartedAt` | `?\DateTimeImmutable` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `owner` | `?User` | ManyToOne | oui | Utilisateur propriétaire de la ressource. |
| `trainingPuzzles` | `Collection` | OneToMany → TrainingPuzzle | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `cycles` | `Collection` | OneToMany → Cycle | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `trainingSessions` | `Collection` | OneToMany → TrainingSession | non | Donnée persistée utilisée par le domaine ou l'interface. |

Méthodes publiques notables : `__construct()`, `getId()`, `getName()`, `setName()`, `getDescription()`, `setDescription()`, `getIcon()`, `setIcon()`, `getIconBackgroundColor()`, `setIconBackgroundColor()`, `getIconColor()`, `setIconColor()`, `getLogo()`, `setLogo()`, `getStatus()`, `setStatus()`, `getMistakeLimit()`, `setMistakeLimit()`.


## `Puzzle`

Fichier : `backend/src/Entity/Puzzle.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `source` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `externalId` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `fen` | `?string` | — | oui | Position initiale au format FEN. |
| `solution` | `array` | — | non | Séquence solution stockée sous forme de coups UCI. |
| `themes` | `array` | — | non | Tags/thèmes tactiques. |
| `rating` | `?int` | — | oui | Difficulté/rating du puzzle. |
| `createdAt` | `?\DateTimeImmutable` | — | oui | Date de création persistée. |
| `trainingPuzzles` | `Collection` | OneToMany → TrainingPuzzle | non | Donnée persistée utilisée par le domaine ou l'interface. |

Méthodes publiques notables : `__construct()`, `getId()`, `getSource()`, `setSource()`, `getExternalId()`, `setExternalId()`, `getFen()`, `setFen()`, `getSolution()`, `setSolution()`, `getThemes()`, `setThemes()`, `getRating()`, `setRating()`, `getCreatedAt()`, `getTrainingPuzzles()`, `addTrainingPuzzle()`, `removeTrainingPuzzle()`.


## `TrainingPuzzle`

Fichier : `backend/src/Entity/TrainingPuzzle.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `training` | `?Training` | ManyToOne | oui | Entraînement parent. |
| `puzzle` | `?Puzzle` | ManyToOne | oui | Puzzle de référence. |
| `position` | `?int` | — | oui | Position du puzzle dans la collection de l'entraînement. |
| `personalNote` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `createdAt` | `?\DateTimeImmutable` | — | oui | Date de création persistée. |
| `cyclePuzzles` | `Collection` | OneToMany → CyclePuzzle | non | Donnée persistée utilisée par le domaine ou l'interface. |

Méthodes publiques notables : `__construct()`, `getId()`, `getTraining()`, `setTraining()`, `getPuzzle()`, `setPuzzle()`, `getPosition()`, `setPosition()`, `getPersonalNote()`, `setPersonalNote()`, `getCreatedAt()`, `getCyclePuzzles()`, `addCyclePuzzle()`, `removeCyclePuzzle()`, `initializeCreatedAt()`.


## `Cycle`

Fichier : `backend/src/Entity/Cycle.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `training` | `?Training` | ManyToOne | oui | Entraînement parent. |
| `number` | `?int` | — | oui | Numéro du cycle. |
| `status` | `CycleStatus` | — | non | État métier contrôlé par un enum. |
| `targetDurationSeconds` | `?int` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `startedAt` | `?\DateTimeImmutable` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `completedAt` | `?\DateTimeImmutable` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `createdAt` | `?\DateTimeImmutable` | — | oui | Date de création persistée. |
| `updatedAt` | `?\DateTimeImmutable` | — | oui | Dernière modification. |
| `cyclePuzzles` | `Collection` | OneToMany → CyclePuzzle | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `trainingSessions` | `Collection` | OneToMany → TrainingSession | non | Donnée persistée utilisée par le domaine ou l'interface. |

Méthodes publiques notables : `__construct()`, `getId()`, `getTraining()`, `setTraining()`, `getNumber()`, `setNumber()`, `getStatus()`, `setStatus()`, `getTargetDurationSeconds()`, `setTargetDurationSeconds()`, `getStartedAt()`, `setStartedAt()`, `getCompletedAt()`, `setCompletedAt()`, `getCreatedAt()`, `getUpdatedAt()`, `getCyclePuzzles()`, `addCyclePuzzle()`.


## `CyclePuzzle`

Fichier : `backend/src/Entity/CyclePuzzle.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `cycle` | `?Cycle` | ManyToOne | oui | Cycle parent. |
| `trainingPuzzle` | `?TrainingPuzzle` | ManyToOne | oui | Association entre entraînement et puzzle. |
| `position` | `?int` | — | oui | Position du puzzle dans la collection de l'entraînement. |
| `status` | `CyclePuzzleStatus` | — | non | État métier contrôlé par un enum. |
| `durationMilliseconds` | `int` | — | non | Durée cumulée en millisecondes. |
| `completedAt` | `?\DateTimeImmutable` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `attempts` | `Collection` | OneToMany → Attempt | non | Donnée persistée utilisée par le domaine ou l'interface. |

Méthodes publiques notables : `__construct()`, `getId()`, `getCycle()`, `setCycle()`, `getTrainingPuzzle()`, `setTrainingPuzzle()`, `getPosition()`, `setPosition()`, `getStatus()`, `setStatus()`, `getCompletedAt()`, `setCompletedAt()`, `getAttemptCount()`, `setAttemptCount()`, `getDurationMilliseconds()`, `setDurationMilliseconds()`, `getAttempts()`, `addAttempt()`.


## `TrainingSession`

Fichier : `backend/src/Entity/TrainingSession.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `training` | `?Training` | ManyToOne | oui | Entraînement parent. |
| `cycle` | `?Cycle` | ManyToOne | oui | Cycle parent. |
| `startedAt` | `?\DateTimeImmutable` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `endedAt` | `?\DateTimeImmutable` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `note` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `attempts` | `Collection` | OneToMany → Attempt | non | Donnée persistée utilisée par le domaine ou l'interface. |

Méthodes publiques notables : `__construct()`, `getId()`, `getTraining()`, `setTraining()`, `getCycle()`, `setCycle()`, `getStartedAt()`, `setStartedAt()`, `getEndedAt()`, `setEndedAt()`, `getNote()`, `setNote()`, `getAttempts()`, `addAttempt()`, `removeAttempt()`, `initializeStartedAt()`.


## `Attempt`

Fichier : `backend/src/Entity/Attempt.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `cyclePuzzle` | `?CyclePuzzle` | ManyToOne | oui | Puzzle dans un cycle précis. |
| `trainingSession` | `?TrainingSession` | ManyToOne | oui | Session de résolution qui porte la tentative. |
| `attemptNumber` | `int` | — | non | Numéro ordinal de la tentative sur un CyclePuzzle. |
| `status` | `AttemptStatus` | — | non | État métier contrôlé par un enum. |
| `playedMoves` | `array` | — | non | Séquence de coups effectivement joués. |
| `mistakesCount` | `int` | — | non | Nombre d'erreurs enregistré pour la tentative. |
| `durationMilliseconds` | `int` | — | non | Durée cumulée en millisecondes. |
| `clientRequestId` | `?string` | — | oui | Identifiant généré côté client pour rendre la synchronisation d'une tentative idempotente. |
| `startedAt` | `?\DateTimeImmutable` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `completedAt` | `?\DateTimeImmutable` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |

Méthodes publiques notables : `getId()`, `getCyclePuzzle()`, `setCyclePuzzle()`, `getTrainingSession()`, `setTrainingSession()`, `getAttemptNumber()`, `setAttemptNumber()`, `getStatus()`, `setStatus()`, `getPlayedMoves()`, `setPlayedMoves()`, `isSuccessful()`, `setSuccessful()`, `getMistakesCount()`, `setMistakesCount()`, `getDurationMilliseconds()`, `setDurationMilliseconds()`, `getClientRequestId()`.


## `AuthenticationEvent`

Fichier : `backend/src/Entity/AuthenticationEvent.php`.

| Champ | Type PHP | Relation | Nullable PHP | Rôle |
|---|---|---|---:|---|
| `id` | `?int` | — | oui | Identifiant technique généré par la base. |
| `user` | `?User` | ManyToOne | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `type` | `AuthenticationEventType` | — | non | Donnée persistée utilisée par le domaine ou l'interface. |
| `createdAt` | `?\DateTimeImmutable` | — | oui | Date de création persistée. |
| `platform` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `browser` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `device` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `logoutReason` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |
| `tokenFingerprint` | `?string` | — | oui | Donnée persistée utilisée par le domaine ou l'interface. |

Méthodes publiques notables : `getId()`, `getUser()`, `setUser()`, `getType()`, `setType()`, `getCreatedAt()`, `setCreatedAt()`, `getPlatform()`, `setPlatform()`, `getBrowser()`, `setBrowser()`, `getDevice()`, `setDevice()`, `getLogoutReason()`, `setLogoutReason()`, `getTokenFingerprint()`, `setTokenFingerprint()`.

## Contraintes et index

Le projet utilise des index sur les relations et champs interrogés fréquemment, par exemple les tentatives par `cycle_puzzle_id`, `training_session_id` et `client_request_id`.

Les contraintes uniques importantes empêchent entre autres :
- e-mail utilisateur dupliqué ;
- positions incohérentes dans certaines associations ;
- identifiants externes/fingerprints dupliqués selon le modèle de puzzle ;
- duplication logique de certaines ressources.

## Pourquoi séparer Puzzle / TrainingPuzzle / CyclePuzzle ?

Fusionner les trois rendrait impossible de distinguer :
- définition globale d'une position ;
- inclusion et ordre dans un entraînement ;
- résultat de cette position dans un cycle particulier.

Cette séparation évite de recopier la FEN/solution à chaque cycle et garde l'historique cohérent.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
