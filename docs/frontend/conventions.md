# Conventions frontend

## Principe général

Le frontend est organisé par **feature**. Un fichier doit rester dans la feature qui porte son sens métier, sauf s'il est réellement réutilisé par plusieurs domaines.

## `app/`

Réservé à :
- bootstrap ;
- routing ;
- layout global ;
- error boundary ;
- configuration de marque.

Ne pas y déplacer des composants métier Training/Solver simplement parce qu'ils sont « importants ».

## `features/<feature>/`

Une feature peut contenir :
- `pages/` ;
- `components/` ;
- `hooks/` ;
- `actions/` ;
- `services/` ;
- `domain/` ;
- `types/` ;
- `utils/` ;
- `styles/`.

Toutes ne sont pas obligatoires.

## `shared/`

Uniquement ce qui est transversal :
- API client ;
- UI primitives ;
- notifications ;
- icônes communes.

Une abstraction utilisée une seule fois n'a pas besoin d'être dans `shared`.

## Queries et mutations

- lecture serveur : TanStack `useQuery` ;
- écriture : `useMutation` ;
- query keys stables et contextualisées par user/Training ;
- invalider uniquement les données dépendantes.

## Types

Les types de contrats API sont centralisés par domaine. Ne pas dupliquer une forme `Training` légèrement différente dans plusieurs pages sans raison.

## CSS

- tokens globaux dans `styles/tokens` ;
- styles partagés UI dans `shared/ui/styles` ;
- styles métier proches de la feature ;
- éviter de réintroduire une feuille monolithique globale.

## Exports

Le script `npm run check:exports` protège les imports/exports relatifs. Le lancer avec le build après refactor de fichiers.

## Tests

Un refactor de composant qui conserve le comportement doit maintenir les tests existants. Ajouter un test lorsqu'une règle utilisateur ou un cas limite nouveau apparaît.
