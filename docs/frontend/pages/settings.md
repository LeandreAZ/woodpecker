# Page — Paramètres

## Route

`/settings`

## Rôle utilisateur

Cette page fait partie du parcours principal de Woodpecker. Elle n'est pas documentée uniquement visuellement : le but de ce chapitre est de montrer quelles données elle lit, quelles mutations elle déclenche et quelles règles backend la protègent.

## Capacités principales

- profil ;
- avatar/email/password ;
- apparence et échiquier ;
- préférences Solver ;

## Fichiers de la feature

- `frontend/src/features/settings/components/AppearanceSettingsSection.tsx`
- `frontend/src/features/settings/components/BoardSettingsSection.tsx`
- `frontend/src/features/settings/components/InteractiveBoardPreview.tsx`
- `frontend/src/features/settings/components/LanguagePicker.tsx`
- `frontend/src/features/settings/components/ProfileSettingsSection.tsx`
- `frontend/src/features/settings/components/SettingsModalShell.tsx`
- `frontend/src/features/settings/components/SolverSettingsSection.tsx`
- `frontend/src/features/settings/hooks/useSettingsActions.ts`
- `frontend/src/features/settings/hooks/useUserSettingsOverviewQuery.ts`
- `frontend/src/features/settings/pages/SettingsView.test.tsx`
- `frontend/src/features/settings/pages/SettingsView.tsx`
- `frontend/src/features/settings/styles/settings.css`
- `frontend/src/features/settings/types/settings.types.ts`
- `frontend/src/features/settings/types/settingsView.types.ts`
- `frontend/src/features/settings/utils/settingsDraft.ts`

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

- `frontend/src/features/settings/pages/SettingsView.test.tsx`
