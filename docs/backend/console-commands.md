# Commandes console propres à Woodpecker

## Lichess

```bash
docker compose exec php php bin/console app:lichess:sync-catalog
```

Synchronise le CSV vers la table locale `lichess_catalog_puzzle`.

Option importante :

```bash
docker compose exec php php bin/console app:lichess:sync-catalog --truncate
```

Repart d'un catalogue vide avant import.

Le chemin peut être fourni explicitement avec `--file` lorsque nécessaire.

## Reset E2E

Commande : `app:e2e:reset`.

Elle est volontairement destructive mais protégée. Le code vérifie notamment :
- environnement dev/test ;
- `WOODPECKER_E2E=1` ;
- nom exact de base E2E.

Ne jamais assouplir cette protection pour « simplifier » un test.

## Commandes Symfony utiles

```bash
php bin/console about
php bin/console debug:router
php bin/console debug:container
php bin/console cache:clear
php bin/console doctrine:migrations:status
```

Dans le workflow Docker, les préfixer par `docker compose exec php`.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
