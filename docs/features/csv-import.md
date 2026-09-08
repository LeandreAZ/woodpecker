# Import CSV

## But

Importer une liste de puzzles tout en donnant un aperçu avant modification de la collection.

## Étape Analyze

Endpoint multipart d'analyse :
1. upload ;
2. `CsvPuzzleParser::parseUpload()` ;
3. normalisation ;
4. validation FEN et coups ;
5. préparation par `TrainingCsvAnalysisService` ;
6. calcul valides/erreurs/doublons/importables ;
7. création d'un `analysisId` aléatoire ;
8. stockage via `CsvAnalysisStore`.

## Pourquoi `analysisId` ?

L'import final doit réutiliser **exactement l'analyse affichée à l'utilisateur** au lieu de reparcourir implicitement une autre version du fichier.

## Cache

`app.csv_import.filesystem` utilise un cache filesystem dans `%kernel.cache_dir%/csv-import`.

La correction historique importante était d'éviter qu'analyze et import se retrouvent sur des caches non partagés/perdus.

## Import

Le frontend envoie l'`analysisId`. Le backend :
- récupère l'analyse ;
- refuse si expirée ;
- calcule les puzzles à importer ;
- appelle `TrainingPuzzleImportService`.

## Doublons

Deux niveaux existent :
- doublons dans l'analyse/fichier ;
- puzzles déjà présents dans le Training.

Le service construit plusieurs clés logiques, notamment source/sourceId et fingerprint FEN+solution.

## Atomicité / cohérence

La persistance passe par un service commun qui trouve/crée `Puzzle` puis crée `TrainingPuzzle` avec ordre cohérent.

## Sécurité

Le Training est chargé comme ressource appartenant au user courant avant analyse/import.

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
- `frontend/src/features/statistics/pages/StatisticsView.test.tsx`
- `frontend/e2e/import.spec.ts`
- `backend/tests/Controller/TrainingPuzzleImportActionTest.php`
- `backend/tests/Import/LichessDatasetProviderTest.php`
- `backend/tests/Import/LichessImportCriteriaFactoryTest.php`
- `backend/tests/Import/TrainingCsvAnalysisServiceTest.php`
