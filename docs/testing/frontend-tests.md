# Tests frontend Vitest / Testing Library

## Inventaire

- `frontend/src/app/routing/appRouter.test.ts`
- `frontend/src/features/auth/components/AuthPanel.test.tsx`
- `frontend/src/features/history/pages/HistoryView.test.tsx`
- `frontend/src/features/import/csv/csvImport.test.ts`
- `frontend/src/features/import/hooks/useImportActions.test.tsx`
- `frontend/src/features/import/hooks/useImportViewState.test.tsx`
- `frontend/src/features/import/pages/ImportView.test.tsx`
- `frontend/src/features/settings/pages/SettingsView.test.tsx`
- `frontend/src/features/solver/components/PuzzleSolver.test.tsx`
- `frontend/src/features/solver/domain/puzzleValidation.test.ts`
- `frontend/src/features/solver/pages/SolverView.test.tsx`
- `frontend/src/features/statistics/pages/StatisticsView.test.tsx`
- `frontend/src/features/trainings/components/identity/TrainingIconCustomizer.test.tsx`
- `frontend/src/features/trainings/hooks/useTrainingsPanelRouting.test.tsx`
- `frontend/src/features/trainings/pages/create/TrainingsCreateView.test.tsx`
- `frontend/src/features/trainings/pages/detail/TrainingsDetailView.test.tsx`
- `frontend/src/features/trainings/pages/edit/TrainingsEditView.test.tsx`
- `frontend/src/features/trainings/pages/panel/TrainingsPanelContentScreen.test.tsx`
- `frontend/src/features/trainings/state/TrainingsQueryState.test.tsx`
- `frontend/src/shared/api/client.test.ts`
- `frontend/src/shared/ui/LoadingButton.test.tsx`
- `frontend/src/shared/ui/Modal.test.tsx`
- `frontend/src/shared/ui/StatePanel.test.tsx`

## Vitest

Runner compatible avec l'écosystème Vite/ESM.

## jsdom

Simule les APIs DOM nécessaires sans Chromium réel.

## Testing Library

Encourage des tests proches des interactions utilisateur plutôt que de l'implémentation interne.

## Types de tests présents

- routeur ;
- API client ;
- composants UI ;
- formulaires Training ;
- import ;
- Solver ;
- History ;
- Stats ;
- Settings.

## Exécution

```bash
docker compose exec frontend npm test
```

Ou localement si les dépendances sont installées dans un environnement compatible.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
