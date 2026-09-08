# Statistiques et formules

## Sources

Les statistiques viennent des Attempts, CyclePuzzles, Cycles et TrainingPuzzles. Elles sont calculées côté backend pour avoir une définition unique.

## Direct

Nombre de CyclePuzzles `status = solved`.

## Failed

Nombre de CyclePuzzles `status = failed`, qu'ils aient ensuite été rattrapés ou non.

## Rescued

Sous-ensemble des failed ayant au moins une Attempt `solved`.

## Unresolved

`failed - rescued`.

## Resolved

Selon les vues : `solved + rescued`.

## Progression d'un cycle

`(solved + failed) / total CyclePuzzles * 100`.

Cette métrique indique la part **traitée** du cycle, pas le taux de réussite.

## Success rate direct

`solved / (solved + failed) * 100`.

Un rescued reste un échec direct dans cette formule.

## Distribution des essais

Pour chaque puzzle qui finit résolu, la tentative solved détermine :
- 1 ;
- 2 ;
- 3 ;
- 4+.

## Durée

Addition/agrégation des durées de CyclePuzzle/Attempts selon le ReadModel.

## Moyennes

Certaines vues calculent :
- moyenne d'erreurs par Attempt terminée ;
- durée moyenne ;
- nombre moyen de tentatives ;
- rating moyen.

## Progress delta

Les readers comparent des cycles ayant réellement de l'activité afin de ne pas produire un delta artificiel contre un cycle vide.

## Frontend

Composants :
- `CycleResultsChart`
- `DistributionDonut`
- `AttemptDistribution`
- `TimeDistribution`
- `GenericLineChart`
- `StatisticsSummary`.

Le frontend formate et visualise ; il ne redéfinit pas les règles de comptage.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.

## Tests directement associés

- `frontend/src/features/import/hooks/useImportViewState.test.tsx`
- `frontend/src/features/statistics/pages/StatisticsView.test.tsx`
- `frontend/src/features/trainings/state/TrainingsQueryState.test.tsx`
- `frontend/src/shared/ui/StatePanel.test.tsx`
- `backend/tests/Controller/StatsOverviewActionTest.php`
- `backend/tests/Controller/TrainingAnalyticsActionTest.php`
- `backend/tests/Controller/TrainingSummaryActionTest.php`
- `backend/tests/State/OwnedTrainingResourceProcessorTest.php`
