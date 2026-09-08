# Référence — classes backend

Cette page est un index mécanique du code actuel. Elle complète les chapitres pédagogiques : lorsqu'un nom de classe est oublié, chercher ici.

## `E2eResetCommand`
Fichier : `backend/src/Command/E2eResetCommand.php`

Méthodes :
- `public __construct()`
- `protected execute()`

## `LichessCatalogSyncCommand`
Fichier : `backend/src/Command/LichessCatalogSyncCommand.php`

Méthodes :
- `public __construct()`
- `protected configure()`
- `protected execute()`
- `private flush()`
- `private arrayLiteral()`

## `AuthLogoutAction`
Fichier : `backend/src/Controller/AuthLogoutAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `HistoryOverviewAction`
Fichier : `backend/src/Controller/HistoryOverviewAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `StatsOverviewAction`
Fichier : `backend/src/Controller/StatsOverviewAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `TrainingAnalyticsAction`
Fichier : `backend/src/Controller/TrainingAnalyticsAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `TrainingAttemptHistoryAction`
Fichier : `backend/src/Controller/TrainingAttemptHistoryAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `TrainingCycleHistoryAction`
Fichier : `backend/src/Controller/TrainingCycleHistoryAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `TrainingDashboardAction`
Fichier : `backend/src/Controller/TrainingDashboardAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`
- `private buildTrainingCard()`

## `TrainingOverviewAction`
Fichier : `backend/src/Controller/TrainingOverviewAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `TrainingPuzzleImportAction`
Fichier : `backend/src/Controller/TrainingPuzzleImportAction.php`

Méthodes :
- `public __construct()`
- `public analyzeCsv()`
- `public importCsv()`
- `public lichessOptions()`
- `public lichessAvailability()`
- `public importLichess()`
- `private requestBoolean()`
- `private currentUser()`
- `private trainingForCurrentUser()`

## `TrainingSummaryAction`
Fichier : `backend/src/Controller/TrainingSummaryAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `UserAvatarUploadAction`
Fichier : `backend/src/Controller/UserAvatarUploadAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`
- `private deletePreviousAvatar()`

## `UserDeleteAction`
Fichier : `backend/src/Controller/UserDeleteAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `UserEmailUpdateAction`
Fichier : `backend/src/Controller/UserEmailUpdateAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `UserPasswordUpdateAction`
Fichier : `backend/src/Controller/UserPasswordUpdateAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`

## `UserSettingsOverviewAction`
Fichier : `backend/src/Controller/UserSettingsOverviewAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`
- `private buildBoardThemeLabel()`
- `private iri()`

## `UserSettingsUpdateAction`
Fichier : `backend/src/Controller/UserSettingsUpdateAction.php`

Méthodes :
- `public __construct()`
- `public __invoke()`
- `private validateHexColor()`
- `private validateAvatarUrl()`

## `CurrentUserTrainingScopeExtension`
Fichier : `backend/src/Doctrine/CurrentUserTrainingScopeExtension.php`

Méthodes :
- `public __construct()`
- `public applyToCollection()`
- `public applyToItem()`
- `private addCurrentUserScope()`
- `private associationPathToTraining()`
- `private joinAssociationPath()`
- `private restrictAliasToOwner()`

## `Attempt`
Fichier : `backend/src/Entity/Attempt.php`

Méthodes :
- `public getId()`
- `public getCyclePuzzle()`
- `public setCyclePuzzle()`
- `public getTrainingSession()`
- `public setTrainingSession()`
- `public getAttemptNumber()`
- `public setAttemptNumber()`
- `public getStatus()`
- `public setStatus()`
- `public getPlayedMoves()`
- `public setPlayedMoves()`
- `public isSuccessful()`
- `public setSuccessful()`
- `public getMistakesCount()`
- `public setMistakesCount()`
- `public getDurationMilliseconds()`
- `public setDurationMilliseconds()`
- `public getClientRequestId()`
- `public setClientRequestId()`
- `public getStartedAt()`
- `public setStartedAt()`
- `public getCompletedAt()`
- `public setCompletedAt()`
- `public getAttemptedAt()`
- `public setAttemptedAt()`
- `public initializeDates()`

## `AuthenticationEvent`
Fichier : `backend/src/Entity/AuthenticationEvent.php`

Méthodes :
- `public getId()`
- `public getUser()`
- `public setUser()`
- `public getType()`
- `public setType()`
- `public getCreatedAt()`
- `public setCreatedAt()`
- `public getPlatform()`
- `public setPlatform()`
- `public getBrowser()`
- `public setBrowser()`
- `public getDevice()`
- `public setDevice()`
- `public getLogoutReason()`
- `public setLogoutReason()`
- `public getTokenFingerprint()`
- `public setTokenFingerprint()`

## `Cycle`
Fichier : `backend/src/Entity/Cycle.php`

Méthodes :
- `public __construct()`
- `public getId()`
- `public getTraining()`
- `public setTraining()`
- `public getNumber()`
- `public setNumber()`
- `public getStatus()`
- `public setStatus()`
- `public getTargetDurationSeconds()`
- `public setTargetDurationSeconds()`
- `public getStartedAt()`
- `public setStartedAt()`
- `public getCompletedAt()`
- `public setCompletedAt()`
- `public getCreatedAt()`
- `public getUpdatedAt()`
- `public getCyclePuzzles()`
- `public addCyclePuzzle()`
- `public removeCyclePuzzle()`
- `public getTrainingSessions()`
- `public addTrainingSession()`
- `public removeTrainingSession()`
- `public initializeTimestamps()`
- `public refreshUpdatedAt()`

## `CyclePuzzle`
Fichier : `backend/src/Entity/CyclePuzzle.php`

Méthodes :
- `public __construct()`
- `public getId()`
- `public getCycle()`
- `public setCycle()`
- `public getTrainingPuzzle()`
- `public setTrainingPuzzle()`
- `public getPosition()`
- `public setPosition()`
- `public getStatus()`
- `public setStatus()`
- `public getCompletedAt()`
- `public setCompletedAt()`
- `public getAttemptCount()`
- `public setAttemptCount()`
- `public getDurationMilliseconds()`
- `public setDurationMilliseconds()`
- `public getAttempts()`
- `public addAttempt()`
- `public removeAttempt()`

## `Puzzle`
Fichier : `backend/src/Entity/Puzzle.php`

Méthodes :
- `public __construct()`
- `public getId()`
- `public getSource()`
- `public setSource()`
- `public getExternalId()`
- `public setExternalId()`
- `public getFen()`
- `public setFen()`
- `public getSolution()`
- `public setSolution()`
- `public getThemes()`
- `public setThemes()`
- `public getRating()`
- `public setRating()`
- `public getCreatedAt()`
- `public getTrainingPuzzles()`
- `public addTrainingPuzzle()`
- `public removeTrainingPuzzle()`
- `public initializeCreatedAt()`

## `Training`
Fichier : `backend/src/Entity/Training.php`

Méthodes :
- `public __construct()`
- `public getId()`
- `public getName()`
- `public setName()`
- `public getDescription()`
- `public setDescription()`
- `public getIcon()`
- `public setIcon()`
- `public getIconBackgroundColor()`
- `public setIconBackgroundColor()`
- `public getIconColor()`
- `public setIconColor()`
- `public getLogo()`
- `public setLogo()`
- `public getStatus()`
- `public setStatus()`
- `public getMistakeLimit()`
- `public setMistakeLimit()`
- `public getCreatedAt()`
- `public getUpdatedAt()`
- `public getFirstCycleStartedAt()`
- `public setFirstCycleStartedAt()`
- `public getOwner()`
- `public setOwner()`
- `public getTrainingPuzzles()`
- `public addTrainingPuzzle()`
- `public removeTrainingPuzzle()`
- `public getCycles()`
- `public addCycle()`
- `public removeCycle()`
- `public getTrainingSessions()`
- `public addTrainingSession()`
- `public removeTrainingSession()`
- `public initializeTimestamps()`
- `public refreshUpdatedAt()`
- `private ensureBranding()`
- `private buildDefaultLogo()`
- `private normalizeIcon()`
- `private normalizeColor()`
- `private resolveLegacyBackgroundColor()`

## `TrainingPuzzle`
Fichier : `backend/src/Entity/TrainingPuzzle.php`

Méthodes :
- `public __construct()`
- `public getId()`
- `public getTraining()`
- `public setTraining()`
- `public getPuzzle()`
- `public setPuzzle()`
- `public getPosition()`
- `public setPosition()`
- `public getPersonalNote()`
- `public setPersonalNote()`
- `public getCreatedAt()`
- `public getCyclePuzzles()`
- `public addCyclePuzzle()`
- `public removeCyclePuzzle()`
- `public initializeCreatedAt()`

## `TrainingSession`
Fichier : `backend/src/Entity/TrainingSession.php`

Méthodes :
- `public __construct()`
- `public getId()`
- `public getTraining()`
- `public setTraining()`
- `public getCycle()`
- `public setCycle()`
- `public getStartedAt()`
- `public setStartedAt()`
- `public getEndedAt()`
- `public setEndedAt()`
- `public getNote()`
- `public setNote()`
- `public getAttempts()`
- `public addAttempt()`
- `public removeAttempt()`
- `public initializeStartedAt()`

## `User`
Fichier : `backend/src/Entity/User.php`

Méthodes :
- `public __construct()`
- `public getId()`
- `public getEmail()`
- `public setEmail()`
- `public getUserIdentifier()`
- `public getPseudonym()`
- `public setPseudonym()`
- `public ensureDefaultPseudonym()`
- `public getAvatarUrl()`
- `private generateDefaultPseudonym()`
- `public setAvatarUrl()`
- `public getRoles()`
- `public setRoles()`
- `public getPassword()`
- `public setPassword()`
- `public getPlainPassword()`
- `public setPlainPassword()`
- `public eraseCredentials()`
- `public getCreatedAt()`
- `public getUpdatedAt()`
- `public getTrainings()`
- `public getPreference()`
- `public setPreference()`
- `public addTraining()`
- `public removeTraining()`
- `public initializeTimestamps()`
- `public refreshUpdatedAt()`

## `UserPreference`
Fichier : `backend/src/Entity/UserPreference.php`

Méthodes :
- `public getId()`
- `public getUser()`
- `public setUser()`
- `public getDisplayName()`
- `public setDisplayName()`
- `public getLanguage()`
- `public setLanguage()`
- `public getTheme()`
- `public setTheme()`
- `public getBoardLightSquare()`
- `public setBoardLightSquare()`
- `public getBoardDarkSquare()`
- `public setBoardDarkSquare()`
- `public shouldShowLegalMoves()`
- `public setShowLegalMoves()`
- `public shouldShowCoordinates()`
- `public setShowCoordinates()`
- `public shouldAnimateMoves()`
- `public setAnimateMoves()`
- `public shouldShowRightClickTargets()`
- `public setShowRightClickTargets()`
- `public getCreatedAt()`
- `public getUpdatedAt()`
- `public initializeTimestamps()`
- `public refreshUpdatedAt()`

## `AttemptStatus`
Fichier : `backend/src/Enum/AttemptStatus.php`

Valeurs :
- `InProgress = 'in_progress'`
- `Failed = 'failed'`
- `Solved = 'solved'`

Représente l'état persistant d'une tentative de résolution.

## `AuthenticationEventType`
Fichier : `backend/src/Enum/AuthenticationEventType.php`

Valeurs :
- `Login = 'login'`
- `Logout = 'logout'`

Identifie le type d'événement conservé dans l'historique d'authentification.

## `CyclePuzzleStatus`
Fichier : `backend/src/Enum/CyclePuzzleStatus.php`

Valeurs :
- `Pending = 'pending'`
- `InProgress = 'in_progress'`
- `Solved = 'solved'`
- `Failed = 'failed'`
- `Skipped = 'skipped'`

Représente l'état agrégé d'un puzzle dans un cycle précis.

## `CycleStatus`
Fichier : `backend/src/Enum/CycleStatus.php`

Valeurs :
- `Planned = 'planned'`
- `Active = 'active'`
- `Completed = 'completed'`

Représente l'étape du cycle Woodpecker.

## `TrainingStatus`
Fichier : `backend/src/Enum/TrainingStatus.php`

Valeurs :
- `Draft = 'draft'`
- `Active = 'active'`
- `Archived = 'archived'`

Représente l'état de publication et d'utilisation d'un entraînement.

## `AuthenticationEventSubscriber`
Fichier : `backend/src/EventSubscriber/AuthenticationEventSubscriber.php`

Méthodes :
- `public __construct()`
- `public onLoginSuccess()`

## `AuthenticationTokenExpiredSubscriber`
Fichier : `backend/src/EventSubscriber/AuthenticationTokenExpiredSubscriber.php`

Méthodes :
- `public __construct()`
- `public onJwtExpired()`
- `private extractBearerToken()`
- `private extractUserIdentifier()`
- `private decodeBase64Url()`

## `CsvAnalysisStore`
Fichier : `backend/src/Import/CsvAnalysisStore.php`

Méthodes :
- `public __construct()`
- `public save()`
- `public get()`

## `CsvPuzzleParser`
Fichier : `backend/src/Import/CsvPuzzleParser.php`

Méthodes :
- `public parseUpload()`
- `public normalizeRecord()`
- `private validateFenAndMoves()`
- `private normalizeNullableString()`
- `private normalizeList()`

## `LichessDatasetProvider`
Fichier : `backend/src/Import/LichessDatasetProvider.php`

Méthodes :
- `public __construct()`
- `public filterOptions()`
- `public isConfigured()`
- `public count()`
- `public select()`
- `private selectCustomDistribution()`
- `private countForTheme()`
- `private fetchSelection()`
- `private fetchRows()`
- `private filters()`
- `private arrayLiteral()`
- `private postgresArray()`
- `private assertCatalogAvailable()`

## `LichessImportCriteriaFactory`
Fichier : `backend/src/Import/LichessImportCriteriaFactory.php`

Méthodes :
- `public fromJson()`
- `private optionalPositiveInteger()`
- `private normalizedList()`
- `private normalizedDistribution()`

## `NormalizedPuzzle`
Fichier : `backend/src/Import/NormalizedPuzzle.php`

Méthodes :
- `public __construct()`
- `public fingerprint()`

## `PuzzleImportValidationException`
Fichier : `backend/src/Import/PuzzleImportValidationException.php`

Méthodes :
- `public __construct()`

## `TrainingCsvAnalysisService`
Fichier : `backend/src/Import/TrainingCsvAnalysisService.php`

Méthodes :
- `public prepareForTraining()`
- `public puzzlesForImport()`
- `private buildExistingTrainingPuzzleKeys()`
- `private buildPuzzleKeys()`
- `private hasMatchingPuzzleKey()`

## `TrainingPuzzleImportService`
Fichier : `backend/src/Import/TrainingPuzzleImportService.php`

Méthodes :
- `public __construct()`
- `public import()`
- `private findOrCreatePuzzle()`
- `private buildPuzzleKeys()`
- `private hasMatchingPuzzleKey()`

## `Kernel`
Fichier : `backend/src/Kernel.php`

Aucune méthode explicite inventoriée (enum/structure simple).

## `HistoryOverviewReader`
Fichier : `backend/src/ReadModel/HistoryOverviewReader.php`

Méthodes :
- `public __construct()`
- `public build()`
- `private buildAttemptHistoryItem()`
- `private buildAuthenticationHistoryItem()`
- `private buildAuthenticationDetail()`
- `private normalizeTraining()`
- `private normalizeCycle()`
- `private iri()`
- `private formatDateTime()`

## `StatsOverviewReader`
Fichier : `backend/src/ReadModel/StatsOverviewReader.php`

Méthodes :
- `public __construct()`
- `public build()`
- `private buildTrainingSummary()`
- `private normalizeTraining()`

## `TrainingAnalyticsReader`
Fichier : `backend/src/ReadModel/TrainingAnalyticsReader.php`

Méthodes :
- `public __construct()`
- `public build()`
- `private buildCycleAnalytics()`
- `private normalizeTraining()`
- `private normalizeCycle()`
- `private withProgressDeltas()`
- `private iri()`

## `TrainingAttemptHistoryReader`
Fichier : `backend/src/ReadModel/TrainingAttemptHistoryReader.php`

Méthodes :
- `public __construct()`
- `public build()`
- `private normalizeTraining()`
- `private normalizeAttempt()`
- `private normalizePuzzle()`
- `private iri()`

## `TrainingCycleHistoryReader`
Fichier : `backend/src/ReadModel/TrainingCycleHistoryReader.php`

Méthodes :
- `public __construct()`
- `public build()`
- `private normalizeCycleHistory()`
- `private normalizeCyclePuzzle()`
- `private normalizeTrainingPuzzle()`
- `private normalizeTraining()`
- `private withProgressDeltas()`
- `private iri()`

## `TrainingOverviewReader`
Fichier : `backend/src/ReadModel/TrainingOverviewReader.php`

Méthodes :
- `public __construct()`
- `public build()`
- `private normalizeTrainingPuzzle()`
- `private normalizePuzzle()`
- `private normalizeCycle()`
- `private normalizeCyclePuzzle()`
- `private normalizeAttempt()`
- `private normalizeTrainingSession()`
- `private iri()`
- `private formatDateTime()`

## `TrainingSummaryReader`
Fichier : `backend/src/ReadModel/TrainingSummaryReader.php`

Méthodes :
- `public __construct()`
- `public build()`
- `private buildCycleSummary()`
- `private emptyAttemptDistribution()`
- `private normalizeAttemptSummary()`
- `private normalizeCycle()`
- `private withProgressDeltas()`
- `private iri()`
- `private formatDateTime()`

## `AttemptRepository`
Fichier : `backend/src/Repository/AttemptRepository.php`

Méthodes :
- `public __construct()`
- `public hasSuccessfulAttemptForCyclePuzzle()`
- `public hasSolvedAttemptForCyclePuzzle()`
- `public hasFailedAttemptForCyclePuzzle()`
- `public findActiveAttemptForCyclePuzzle()`
- `public countCompletedAttemptsForCyclePuzzle()`
- `public sumDurationsForCyclePuzzle()`
- `public getNextAttemptNumberForCyclePuzzle()`
- `public findLatestCompletedAtForCyclePuzzle()`
- `public findOneByClientRequestId()`
- `public findByTrainingOrdered()`
- `private hasAttemptWithStatus()`

## `AuthenticationEventRepository`
Fichier : `backend/src/Repository/AuthenticationEventRepository.php`

Méthodes :
- `public __construct()`
- `public findByUserOrdered()`
- `public findOneByTokenFingerprint()`
- `public findLatestByUserAndType()`

## `CyclePuzzleRepository`
Fichier : `backend/src/Repository/CyclePuzzleRepository.php`

Méthodes :
- `public __construct()`
- `public hasIncompleteCyclePuzzleForCycle()`
- `public findByTrainingOrdered()`

## `CycleRepository`
Fichier : `backend/src/Repository/CycleRepository.php`

Méthodes :
- `public __construct()`
- `public hasActiveCycleForTraining()`
- `public hasCycleForTraining()`
- `public findByTrainingOrdered()`

## `PuzzleRepository`
Fichier : `backend/src/Repository/PuzzleRepository.php`

Méthodes :
- `public __construct()`

## `TrainingPuzzleRepository`
Fichier : `backend/src/Repository/TrainingPuzzleRepository.php`

Méthodes :
- `public __construct()`
- `public findByTrainingWithPuzzleOrdered()`

## `TrainingRepository`
Fichier : `backend/src/Repository/TrainingRepository.php`

Méthodes :
- `public __construct()`
- `public findOneOwnedByUser()`
- `public findOwnedByUserOrdered()`

## `TrainingSessionRepository`
Fichier : `backend/src/Repository/TrainingSessionRepository.php`

Méthodes :
- `public __construct()`
- `public findByTrainingOrdered()`

## `UserPreferenceRepository`
Fichier : `backend/src/Repository/UserPreferenceRepository.php`

Méthodes :
- `public __construct()`
- `public findOneByUser()`

## `UserRepository`
Fichier : `backend/src/Repository/UserRepository.php`

Méthodes :
- `public __construct()`
- `public upgradePassword()`

## `TrainingOwnershipChecker`
Fichier : `backend/src/Security/TrainingOwnershipChecker.php`

Méthodes :
- `public isOwnedByCurrentUser()`
- `private getTraining()`
- `private hasConsistentTrainingRelations()`
- `private isSameTraining()`

## `AuthenticationEventRecorder`
Fichier : `backend/src/Service/AuthenticationEventRecorder.php`

Méthodes :
- `public __construct()`
- `public record()`
- `private extractClientContext()`
- `private detectPlatform()`
- `private detectBrowser()`
- `private detectDevice()`
- `private extractBearerTokenFingerprint()`

## `CycleCompletionService`
Fichier : `backend/src/Service/CycleCompletionService.php`

Méthodes :
- `public __construct()`
- `public synchronizeCyclePuzzleState()`

## `SolverAttemptLifecycleService`
Fichier : `backend/src/Service/SolverAttemptLifecycleService.php`

Méthodes :
- `public __construct()`
- `public persistAttempt()`
- `private initializeAttempt()`
- `private mergeAttempt()`
- `private refreshCyclePuzzleAggregate()`
- `private isCyclePuzzleFrozen()`
- `private normalizeAttemptStatus()`

## `UserPreferenceManager`
Fichier : `backend/src/Service/UserPreferenceManager.php`

Méthodes :
- `public __construct()`
- `public getOrCreate()`

## `OwnedTrainingResourceProcessor`
Fichier : `backend/src/State/OwnedTrainingResourceProcessor.php`

Méthodes :
- `public __construct()`
- `public process()`
- `private preventDuplicateActiveCycle()`
- `private preventTrainingPuzzleChangeAfterFirstCycle()`
- `private normalizeCyclePuzzleProgress()`
- `private completeCycleIfReady()`

## `TrainingOwnerProcessor`
Fichier : `backend/src/State/TrainingOwnerProcessor.php`

Méthodes :
- `public __construct()`
- `public process()`

## `UserPasswordHasherProcessor`
Fichier : `backend/src/State/UserPasswordHasherProcessor.php`

Méthodes :
- `public __construct()`
- `public process()`
