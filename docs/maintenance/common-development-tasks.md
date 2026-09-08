# Tâches de développement courantes

## Démarrer

```bash
docker compose up -d --wait
```

## Rebuild

```bash
docker compose up -d --build --wait
```

## Logs

```bash
docker compose logs -f php
docker compose logs -f frontend
```

## Symfony

```bash
docker compose exec php php bin/console debug:router
docker compose exec php php bin/console doctrine:migrations:status
docker compose exec php php bin/phpunit
```

## Frontend

```bash
docker compose exec frontend npm test
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

## Catalogue Lichess

```bash
docker compose exec php php bin/console app:lichess:sync-catalog
```

## E2E

```bash
npm --prefix frontend run e2e
```

## Réinitialiser les données de dev

```bash
docker compose down -v
docker compose up -d --build --wait
```

Cette opération supprime les volumes.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
