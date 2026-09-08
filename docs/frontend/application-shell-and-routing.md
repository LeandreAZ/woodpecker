# Shell applicatif et routeur

## Routeur maison

`frontend/src/app/routing/appRouter.ts` utilise directement l'History API.

Routes :
- `/auth`
- `/` et `/dashboard`
- `/trainings/new`
- `/trainings/:id`
- `/trainings/:id/edit`
- `/trainings/:id/import`
- `/trainings/:id/solver`
- `/stats`
- `/history`
- `/settings`
- fallback `not-found`.

## `parseRoute()`

Normalise le slash terminal puis :
- résout les routes simples via une map ;
- applique une regex aux routes training dynamiques ;
- exige un ID entier positif ;
- retourne `not-found` sinon.

## `navigate()`

Construit le path et appelle :
- `history.pushState` en navigation normale ;
- `history.replaceState` pour une redirection.

Puis l'état React `route` est mis à jour.

## Back/forward

Le hook écoute `popstate`.

## Scroll

Le routeur force une restauration manuelle et synchronise le scroll lors des navigations.

## Auth guard

`App.tsx` redirige :
- session absente + route protégée -> `/auth` ;
- session présente + `/auth` -> dashboard.

Ce guard améliore l'UX ; la sécurité réelle reste côté API.

## Pourquoi pas React Router ?

Le nombre de routes est limité et le besoin reste simple. Un routeur maison réduit la dépendance. En revanche, pour nested routes, data routers, loaders, guards complexes ou URLs plus riches, React Router/TanStack Router deviendraient probablement plus maintenables.

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

- `frontend/src/app/routing/appRouter.test.ts`
