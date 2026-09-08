# Page — Historique

## Route

`/history`

## Rôle utilisateur

Cette page fait partie du parcours principal de Woodpecker. Elle n'est pas documentée uniquement visuellement : le but de ce chapitre est de montrer quelles données elle lit, quelles mutations elle déclenche et quelles règles backend la protègent.

## Capacités principales

- timeline/table ;
- filtres et pagination ;
- tentatives + événements d'authentification ;

## Fichiers de la feature

- `frontend/src/features/history/components/HistoryFilters.tsx`
- `frontend/src/features/history/components/HistoryPagination.tsx`
- `frontend/src/features/history/components/HistoryStatusBadge.tsx`
- `frontend/src/features/history/components/HistoryTable.tsx`
- `frontend/src/features/history/components/HistoryTimeline.tsx`
- `frontend/src/features/history/hooks/useHistoryOverviewQuery.ts`
- `frontend/src/features/history/pages/HistoryView.test.tsx`
- `frontend/src/features/history/pages/HistoryView.tsx`
- `frontend/src/features/history/styles/history.css`
- `frontend/src/features/history/types/history.types.ts`
- `frontend/src/features/history/types/historyView.types.ts`
- `frontend/src/features/history/utils/historyFilters.ts`
- `frontend/src/features/history/utils/historyFormatting.ts`

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

- `frontend/src/features/history/pages/HistoryView.test.tsx`
