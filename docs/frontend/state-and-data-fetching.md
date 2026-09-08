# État React et données serveur

## Deux familles d'état

### État UI local
Exemples :
- modal ouverte ;
- page courante ;
- draft formulaire ;
- sélection temporaire.

Utilise `useState`, `useRef`, hooks de feature.

### État serveur
Exemples :
- trainings ;
- CyclePuzzles ;
- stats ;
- history ;
- settings.

Utilise TanStack Query.

## Pourquoi ne pas recopier tout dans `useState` ?

Les données serveur ont des problèmes spécifiques :
- cache ;
- chargement ;
- erreur ;
- refetch ;
- invalidation ;
- déduplication ;
- cohérence après mutation.

TanStack Query traite ces problèmes.

## Queries

Les hooks comme `useStatsOverviewQuery`, `useHistoryOverviewQuery` et `useTrainingsPanelQueries` déclarent des `queryKey`.

Une query key représente l'identité logique d'une donnée dans le cache.

## Mutations

Les actions Training/Solver/Settings utilisent `useMutation`.

Après succès, elles invalident ou patchent les caches concernés.

## Optimistic update Solver

Le Solver est un cas avancé : il met à jour le cache du CyclePuzzle dès `onMutate` pour éviter une UI bloquée en attendant le serveur, puis invalide les données après succès.

## Risque

Une invalidation trop large provoque trop de requêtes ; trop étroite laisse une UI obsolète. Il faut suivre les dépendances de chaque écran.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
