# Page — Statistiques

## Route

`/stats`

## Rôle utilisateur

Cette page fait partie du parcours principal de Woodpecker. Elle n'est pas documentée uniquement visuellement : le but de ce chapitre est de montrer quelles données elle lit, quelles mutations elle déclenche et quelles règles backend la protègent.

## Capacités principales

- agrégats globaux ;
- courbes par cycle ;
- distribution de résultats et d'essais ;

## Fichiers de la feature

- `frontend/src/features/statistics/components/AttemptDistribution.tsx`
- `frontend/src/features/statistics/components/ChartEmpty.tsx`
- `frontend/src/features/statistics/components/CycleResultsChart.tsx`
- `frontend/src/features/statistics/components/DistributionDonut.tsx`
- `frontend/src/features/statistics/components/DistributionLegend.tsx`
- `frontend/src/features/statistics/components/GenericLineChart.tsx`
- `frontend/src/features/statistics/components/ResultDistribution.tsx`
- `frontend/src/features/statistics/components/StatisticsFilterIcons.tsx`
- `frontend/src/features/statistics/components/StatisticsSummary.tsx`
- `frontend/src/features/statistics/components/TimeDistribution.tsx`
- `frontend/src/features/statistics/components/TrainingCell.tsx`
- `frontend/src/features/statistics/hooks/useStatsOverviewQuery.ts`
- `frontend/src/features/statistics/pages/StatisticsView.test.tsx`
- `frontend/src/features/statistics/pages/StatisticsView.tsx`
- `frontend/src/features/statistics/styles/charts.css`
- `frontend/src/features/statistics/styles/cycle-results.css`
- `frontend/src/features/statistics/styles/distributions.css`
- `frontend/src/features/statistics/styles/global-charts.css`
- `frontend/src/features/statistics/styles/global-layout.css`
- `frontend/src/features/statistics/styles/global-panels.css`
- `frontend/src/features/statistics/styles/global-responsive.css`
- `frontend/src/features/statistics/styles/statistics-layout.css`
- `frontend/src/features/statistics/styles/statistics-page.css`
- `frontend/src/features/statistics/styles/statistics-responsive.css`
- `frontend/src/features/statistics/styles/statistics-v2-charts.css`
- `frontend/src/features/statistics/styles/statistics-v2-distributions.css`
- `frontend/src/features/statistics/styles/statistics-v2-layout.css`
- `frontend/src/features/statistics/styles/statistics-v2-responsive.css`
- `frontend/src/features/statistics/styles/statistics.css`
- `frontend/src/features/statistics/types/statistics.types.ts`
- `frontend/src/features/statistics/types/statisticsView.types.ts`
- `frontend/src/features/statistics/utils/statisticsFormatting.ts`
- `frontend/src/features/statistics/utils/statisticsModel.ts`

## Flux de données

1. le routeur traduit l'URL en `AppRoute` ;
2. `TrainingsPanelView`/la page choisit les queries nécessaires ;
3. TanStack Query charge les endpoints ;
4. `TrainingsQueryState` affiche skeleton ou erreur si nécessaire ;
5. les composants construisent la vue ;
6. une action utilisateur déclenche une mutation ;
7. l'API valide et persiste ;
8. les caches pertinents sont patchés/invalidados ;
9. l'écran se resynchronise.

## Loading, erreur et vide

La page doit distinguer :
- chargement initial sans donnée ;
- refetch avec ancienne donnée encore visible ;
- erreur HTTP ;
- absence métier de données.

## Sécurité

Les restrictions visuelles ne sont jamais considérées comme de l'autorisation. Toute ressource Training doit rester protégée côté backend.

## Responsive

Les styles de feature contiennent les adaptations d'écran. Toute modification importante doit être testée au minimum sur largeur desktop et mobile.

## Comment faire évoluer cette page

Avant toute modification :
- identifier le ReadModel/endpoint utilisé ;
- vérifier si le besoin peut être résolu dans les données déjà disponibles ;
- éviter de charger un graphe Doctrine complet depuis React ;
- conserver les états loading/error ;
- mettre à jour le test de page et, si parcours critique, Playwright.


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

- `frontend/src/features/statistics/pages/StatisticsView.test.tsx`
