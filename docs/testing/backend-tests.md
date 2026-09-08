# Tests backend PHPUnit

## Inventaire

- `backend/tests/Command/E2eResetCommandTest.php`
- `backend/tests/Controller/AuthLogoutActionTest.php`
- `backend/tests/Controller/HistoryOverviewActionTest.php`
- `backend/tests/Controller/StatsOverviewActionTest.php`
- `backend/tests/Controller/TrainingAnalyticsActionTest.php`
- `backend/tests/Controller/TrainingAttemptHistoryActionTest.php`
- `backend/tests/Controller/TrainingCycleHistoryActionTest.php`
- `backend/tests/Controller/TrainingDashboardActionTest.php`
- `backend/tests/Controller/TrainingOverviewActionTest.php`
- `backend/tests/Controller/TrainingPuzzleImportActionTest.php`
- `backend/tests/Controller/TrainingSummaryActionTest.php`
- `backend/tests/Controller/UserAvatarUploadActionTest.php`
- `backend/tests/Controller/UserDeleteActionTest.php`
- `backend/tests/Controller/UserEmailUpdateActionTest.php`
- `backend/tests/Controller/UserHttpSecurityTest.php`
- `backend/tests/Controller/UserPasswordUpdateActionTest.php`
- `backend/tests/Controller/UserSettingsOverviewActionTest.php`
- `backend/tests/Controller/UserSettingsUpdateActionTest.php`
- `backend/tests/Entity/UserTest.php`
- `backend/tests/EventSubscriber/AuthenticationEventSubscriberTest.php`
- `backend/tests/EventSubscriber/AuthenticationTokenExpiredSubscriberTest.php`
- `backend/tests/Import/LichessDatasetProviderTest.php`
- `backend/tests/Import/LichessImportCriteriaFactoryTest.php`
- `backend/tests/Import/TrainingCsvAnalysisServiceTest.php`
- `backend/tests/Security/TrainingOwnershipCheckerTest.php`
- `backend/tests/Service/AuthenticationEventRecorderTest.php`
- `backend/tests/Service/CycleCompletionServiceTest.php`
- `backend/tests/Service/SolverAttemptLifecycleServiceTest.php`
- `backend/tests/State/OwnedTrainingResourceProcessorTest.php`
- `backend/tests/bootstrap.php`

## Ce qu'ils doivent protéger

- validation d'entités ;
- ownership ;
- processors ;
- lifecycle Attempt/Cycle ;
- ReadModels ;
- CSV ;
- Lichess ;
- auth/settings ;
- commandes de sécurité E2E.

## Exécution

```bash
docker compose exec php php bin/phpunit
```

## Test vs production

`when@test` diminue volontairement le coût du password hasher pour accélérer la suite. Ce n'est pas le réglage à reproduire en production.

## Base

Doctrine ajoute un suffixe de DB de test lorsque le contexte test l'exige. La stack E2E possède de son côté une base totalement dédiée.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
