# Smoke test et validation de release

## Script

`scripts/smoke/smoke-test.ps1`.

Il effectue une validation transversale plus légère qu'une campagne E2E complète :
- services Compose ;
- syntaxe/commandes backend ;
- lint/build frontend ;
- vérifications PostgreSQL ;
- disponibilité HTTP.

## Autres commandes

Frontend :
```bash
npm run lint
npm run test
npm run build
npm run check:exports
npm audit
```

Backend :
```bash
php bin/phpunit
composer audit
php bin/console lint:yaml config
php bin/console lint:container
```

## `git diff --check`

Détecte notamment certains whitespace anormaux. Le projet a historiquement mélangé CRLF/LF ; une politique `.gitattributes` pourra être ajoutée lors de la reconstruction Git pour normaliser les futurs diffs.

## Validation proportionnée

Un changement de doc n'impose pas 13 E2E. Un changement Solver, oui beaucoup plus probablement.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
