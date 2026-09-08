# Composants partagés et design system

## `shared/ui`

Le projet possède notamment :
- Button ;
- LoadingButton ;
- Card ;
- Badge ;
- Input ;
- Textarea ;
- Select ;
- Modal ;
- ConfirmationModal ;
- EmptyState ;
- StatePanel ;
- PageSkeleton ;
- StatCard ;
- Notifications.

L'objectif est d'éviter qu'une feature réimplémente chaque primitive avec des comportements visuels divergents.

## Design tokens

`frontend/src/styles/tokens/` :
- `colors.css`
- `radius.css`
- `spacing.css`
- `typography.css`.

Les styles de feature consomment les variables au lieu de répéter les valeurs arbitraires.

## Icônes

`lucide-react` fournit les icônes générales. `shared/icons/AppIcons.tsx` centralise certaines associations métier. Les drapeaux de langues constituent l'unique exception : `LanguagePicker` utilise la bibliothèque spécialisée `country-flag-icons/react/3x2` afin de conserver un rendu vectoriel cohérent entre systèmes.

## États communs

Loading, empty, error et 404 sont traités comme des états de première classe. `TrainingsQueryState` choisit notamment skeleton/error selon la vue active.

## Responsive

Le responsive reste en CSS et comporte des feuilles dédiées pour plusieurs grosses features. Le Solver adapte aussi le nombre de puzzles visibles selon la largeur.

## Accessibilité

Les composants doivent continuer à préserver :
- boutons natifs ;
- labels ;
- focus ;
- fermeture modal ;
- navigation clavier raisonnable.

Une future passe d'accessibilité exhaustive pourrait encore renforcer ARIA et contraste.

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

- `frontend/src/shared/ui/LoadingButton.test.tsx`
- `frontend/src/shared/ui/Modal.test.tsx`
- `frontend/src/shared/ui/StatePanel.test.tsx`
