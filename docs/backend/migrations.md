# Migrations Doctrine

## Fichiers actuels

- `backend/migrations/Version20260725113000.php`
- `backend/migrations/Version20260725120500.php`
- `backend/migrations/Version20260725122500.php`
- `backend/migrations/Version20260731163000.php`
- `backend/migrations/Version20260731171500.php`
- `backend/migrations/Version20260731184500.php`
- `backend/migrations/Version20260813100000.php`
- `backend/migrations/Version20260821194500.php`
- `backend/migrations/Version20260826103000.php`
- `backend/migrations/Version20260827103000.php`
- `backend/migrations/Version20260827153000.php`
- `backend/migrations/Version20260827183000.php`
- `backend/migrations/Version20260827193000.php`
- `backend/migrations/Version20260828223000.php`
- `backend/migrations/Version20260829001500.php`
- `backend/migrations/Version20260829103000.php`
- `backend/migrations/Version20260829123000.php`
- `backend/migrations/Version20260903210000.php`
- `backend/migrations/Version20260903213000.php`

## Rôle

Une migration décrit une évolution du schéma SQL de manière versionnée.

Workflow typique :

```bash
docker compose exec php php bin/console doctrine:migrations:diff
docker compose exec php php bin/console doctrine:migrations:migrate
docker compose exec php php bin/console doctrine:migrations:status
```

## Pourquoi ne pas modifier directement PostgreSQL ?

Sinon les autres machines et la CI ne savent pas reproduire le schéma.

## Après publication

Éviter de réécrire une migration déjà distribuée. Ajouter une nouvelle migration corrective conserve une histoire reproductible.

## Vérification

Après changement d'entité :
1. générer/relire le SQL ;
2. vérifier contraintes et pertes de données ;
3. migrer une base de dev ;
4. lancer tests backend/E2E adaptés.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
