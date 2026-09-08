# Page — Modification d'entraînement

## Route

`/trainings/:id/edit`

## Rôle utilisateur

Cette page fait partie du parcours principal de Woodpecker. Elle n'est pas documentée uniquement visuellement : le but de ce chapitre est de montrer quelles données elle lit, quelles mutations elle déclenche et quelles règles backend la protègent.

## Capacités principales

- mise à jour PATCH ;
- branding ;
- verrouillage métier de la collection après cycle ;

## Fichiers de la feature

- `frontend/src/features/trainings/actions/actionTypes.ts`
- `frontend/src/features/trainings/actions/useCycleActions.ts`
- `frontend/src/features/trainings/actions/useTrainingActions.ts`
- `frontend/src/features/trainings/actions/useTrainingPuzzleActions.ts`
- `frontend/src/features/trainings/components/detail/DetailCollection.tsx`
- `frontend/src/features/trainings/components/detail/DetailCycles.tsx`
- `frontend/src/features/trainings/components/detail/DetailHeader.tsx`
- `frontend/src/features/trainings/components/detail/DetailSummary.tsx`
- `frontend/src/features/trainings/components/identity/TrainingBranding.tsx`
- `frontend/src/features/trainings/components/identity/TrainingIconCustomizer.test.tsx`
- `frontend/src/features/trainings/components/identity/TrainingIconCustomizer.tsx`
- `frontend/src/features/trainings/components/identity/TrainingIdentityFormView.tsx`
- `frontend/src/features/trainings/components/primitives/TrainingsViewPrimitives.tsx`
- `frontend/src/features/trainings/hooks/useTrainingsPanelActions.ts`
- `frontend/src/features/trainings/hooks/useTrainingsPanelQueries.ts`
- `frontend/src/features/trainings/hooks/useTrainingsPanelRouting.test.tsx`
- `frontend/src/features/trainings/hooks/useTrainingsPanelRouting.ts`
- `frontend/src/features/trainings/hooks/useTrainingsPanelUiState.ts`
- `frontend/src/features/trainings/mocks/previewData.ts`
- `frontend/src/features/trainings/models/detailModel.ts`
- `frontend/src/features/trainings/pages/create/TrainingsCreateView.test.tsx`
- `frontend/src/features/trainings/pages/create/TrainingsCreateView.tsx`
- `frontend/src/features/trainings/pages/detail/TrainingsDetailView.test.tsx`
- `frontend/src/features/trainings/pages/detail/TrainingsDetailView.tsx`
- `frontend/src/features/trainings/pages/edit/TrainingsEditView.test.tsx`
- `frontend/src/features/trainings/pages/edit/TrainingsEditView.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanel.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContent.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContentScreen.test.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContentScreen.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContentViews.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelView.tsx`
- `frontend/src/features/trainings/state/TrainingsQueryState.test.tsx`
- `frontend/src/features/trainings/state/TrainingsQueryState.tsx`
- `frontend/src/features/trainings/state/useTrainingsPanelState.ts`
- `frontend/src/features/trainings/styles/detail/detail-collection-refinements.css`
- `frontend/src/features/trainings/styles/detail/detail-collection.css`
- `frontend/src/features/trainings/styles/detail/detail-cycle-refinements.css`
- `frontend/src/features/trainings/styles/detail/detail-cycles.css`
- `frontend/src/features/trainings/styles/detail/detail-layout.css`
- `frontend/src/features/trainings/styles/detail/detail-modals.css`
- `frontend/src/features/trainings/styles/detail/detail-responsive.css`
- `frontend/src/features/trainings/styles/detail/detail-summary.css`
- `frontend/src/features/trainings/styles/detail/detail.css`
- `frontend/src/features/trainings/styles/identity/training-branding.css`
- `frontend/src/features/trainings/styles/identity/training-form.css`
- `frontend/src/features/trainings/styles/identity/training-icon-customizer.css`
- `frontend/src/features/trainings/styles/identity/training-identity-form.css`
- `frontend/src/features/trainings/styles/panel/panel-layout.css`
- `frontend/src/features/trainings/styles/trainings-common.css`
- `frontend/src/features/trainings/types/detail.types.ts`
- `frontend/src/features/trainings/types/training.types.ts`
- `frontend/src/features/trainings/utils/training.utils.ts`

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

- `frontend/src/features/trainings/components/identity/TrainingIconCustomizer.test.tsx`
- `frontend/src/features/trainings/hooks/useTrainingsPanelRouting.test.tsx`
- `frontend/src/features/trainings/pages/create/TrainingsCreateView.test.tsx`
- `frontend/src/features/trainings/pages/detail/TrainingsDetailView.test.tsx`
- `frontend/src/features/trainings/pages/edit/TrainingsEditView.test.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContentScreen.test.tsx`
- `frontend/src/features/trainings/state/TrainingsQueryState.test.tsx`
