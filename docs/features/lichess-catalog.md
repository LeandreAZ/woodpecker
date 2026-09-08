# Catalogue Lichess local

## Pourquoi un catalogue local ?

Le dataset Lichess contient énormément de puzzles. Le lire intégralement à chaque demande frontend serait coûteux. Woodpecker le synchronise dans PostgreSQL puis filtre en SQL.

## Synchronisation

```bash
docker compose exec php php bin/console app:lichess:sync-catalog
```

Source par défaut : `LICHESS_PUZZLE_DATASET_PATH`.

## Table

La migration récente crée `lichess_catalog_puzzle` avec champs destinés au filtrage, notamment :
- identifiant Lichess ;
- FEN ;
- moves ;
- rating ;
- thèmes ;
- opening tags ;
- move_count.

Des index PostgreSQL accélèrent les critères fréquents.

## `LichessDatasetProvider`

Méthodes :
- `filterOptions()` ;
- `isConfigured()` ;
- `count(criteria)` ;
- `select(criteria)`.

## Critères

`LichessImportCriteriaFactory` normalise JSON :
- count ;
- rating min/max ;
- themes ;
- openings/tags selon interface ;
- min/max moves ;
- seed ;
- distribution ;
- themeDistribution.

## Disponibilité

Avant import, le frontend peut demander `availableCount`.

## Sélection

Le provider vérifie que suffisamment de puzzles correspondent.

Pour distribution custom :
- quota par thème calculé à partir des pourcentages ;
- sélection sans réutiliser les IDs déjà pris ;
- dernier thème reçoit le reste pour compenser les arrondis.

## Seed

La seed permet une sélection reproductible/ordonnée sans dépendre d'un `ORDER BY random()` très coûteux sur un gros dataset.

## Pourquoi PostgreSQL ?

Les tableaux/thèmes et index permettent de faire le filtrage près des données plutôt que de charger le dataset en PHP.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.

## Tests directement associés

- `frontend/src/features/import/csv/csvImport.test.ts`
- `frontend/src/features/import/hooks/useImportActions.test.tsx`
- `frontend/src/features/import/hooks/useImportViewState.test.tsx`
- `frontend/src/features/import/pages/ImportView.test.tsx`
- `frontend/e2e/import.spec.ts`
- `backend/tests/Controller/TrainingPuzzleImportActionTest.php`
- `backend/tests/Import/LichessDatasetProviderTest.php`
- `backend/tests/Import/LichessImportCriteriaFactoryTest.php`
- `backend/tests/Import/TrainingCsvAnalysisServiceTest.php`
