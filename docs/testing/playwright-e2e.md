# Playwright E2E

## Specs

- `frontend/e2e/auth.spec.ts`
- `frontend/e2e/chessboard.spec.ts`
- `frontend/e2e/import.spec.ts`
- `frontend/e2e/mobile.spec.ts`
- `frontend/e2e/permissions.spec.ts`
- `frontend/e2e/routing-errors.spec.ts`
- `frontend/e2e/settings.spec.ts`
- `frontend/e2e/solver.spec.ts`
- `frontend/e2e/training.spec.ts`

## Rôle

Playwright lance un vrai Chromium et teste l'application complète.

## Couvertures importantes

- inscription/login ;
- cycle de vie Training ;
- import ;
- Solver multi-tentatives ;
- permissions ;
- settings ;
- mobile ;
- routing/error states.

## Solver de certification

Le scénario critique reconstruit plusieurs cycles et vérifie les distinctions direct/rescued/unresolved ainsi que la distribution des essais.

## Commandes

```bash
npm --prefix frontend run e2e
npm --prefix frontend run e2e:smoke
npm --prefix frontend run e2e:headed
npm --prefix frontend run e2e:ui
npm --prefix frontend run e2e:report
```

## Pourquoi pas tout en E2E ?

Les E2E sont plus lents et plus sensibles à l'environnement. Les calculs purs doivent rester testés plus bas ; l'E2E prouve que les couches coopèrent.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
