# Mise à jour des dépendances

## Lockfiles

- PHP : `composer.lock`
- frontend : `package-lock.json`

Ils figent les versions exactes.

## Avant update

1. lire changelog ;
2. identifier breaking changes ;
3. sauvegarder état Git ;
4. mettre à jour une famille logique, pas tout au hasard.

## Après update frontend

```bash
npm test
npm run lint
npm run build
npm audit
```

Pour React/Vite/chessboard/TanStack Query, envisager E2E ciblé.

## Après update backend

```bash
php bin/phpunit
composer audit
php bin/console lint:container
```

## Major versions

Une major n'est pas une tâche de maintenance anodine. Elle mérite une branche/changement dédié et documentation.

## `npm ci`

Pour CI/production reproductible, `npm ci` est généralement préférable lorsque le lockfile doit être appliqué strictement. L'environnement de dev actuel utilise un entrypoint plus souple.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
