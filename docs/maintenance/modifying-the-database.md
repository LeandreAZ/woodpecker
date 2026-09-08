# Modifier la base de données

## Workflow

1. modifier l'entité ;
2. vérifier validation/relations ;
3. générer migration ;
4. **lire la migration** ;
5. appliquer en dev ;
6. lancer tests ;
7. documenter.

```bash
docker compose exec php php bin/console doctrine:migrations:diff
docker compose exec php php bin/console doctrine:migrations:migrate
```

## Changement destructif

Avant supprimer/renommer une colonne :
- penser aux données existantes ;
- prévoir migration de données ;
- ne pas simplement recréer la base.

## Relations

Choisir cascade/orphanRemoval avec prudence : une cascade mal placée peut supprimer beaucoup plus que prévu.

## Index

Ajouter un index lorsque la requête réelle le justifie. Vérifier filtre/join/order récurrents.

## API

Une colonne backend ne doit pas devenir automatiquement publique : vérifier Groups/ReadModels/types frontend.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
