# Stratégie de tests

## Niveaux

### PHPUnit
Valide backend, règles, sécurité, imports, readers, lifecycle.

### Vitest + Testing Library
Valide composants/hooks/frontend sans lancer un navigateur complet.

### Playwright
Valide les parcours critiques dans Chromium contre la vraie stack Docker.

### Smoke test
Valide rapidement la santé de la stack, build, endpoints et SQL.

## Inventaire

Backend : 30 fichiers PHP de test.

Frontend : 23 fichiers de test.

E2E : 9 specs Playwright.

## Philosophie

Un E2E ne doit pas remplacer 50 tests ciblés. Les E2E couvrent surtout les contrats critiques entre couches.

La campagne finale certifiée a validé 13 scénarios Playwright, 114 tests frontend et 95 tests backend / 694 assertions.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
