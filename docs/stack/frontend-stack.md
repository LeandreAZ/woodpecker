# Stack frontend — cours appliqué

## TypeScript

Version lockée : `5.9.3`.

Ajoute un système de types statiques au JavaScript. Il ne sécurise pas les données serveur à l'exécution : les types décrivent le contrat attendu.

## React

Version : `19.2.8`.

Composants déclaratifs, hooks et composition de vues.

Alternative : Vue, Angular, Svelte.

## Vite

Version : `7.3.6`.

Serveur de développement rapide et bundler de production.

## TanStack Query

Version : `5.101.4`.

Gère l'état **serveur** : query cache, loading, erreurs, invalidation, mutation.

### Pourquoi pas `fetch + useEffect` partout ?

Il faudrait réécrire :
- cache ;
- race handling ;
- refetch ;
- dedup ;
- loading/error ;
- invalidation après mutation.

### Alternatives
- SWR : approche proche, plus minimaliste ;
- RTK Query : très pertinent si Redux Toolkit est déjà central ;
- Zustand : état client, pas remplaçant direct d'un query cache ;
- Axios : client HTTP, pas gestionnaire d'état serveur.

## Lucide

Version : `1.34.0`.

Icônes SVG React cohérentes.

## Vitest / Testing Library

Vitest est naturellement compatible Vite. Testing Library teste l'interface via comportements accessibles.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
