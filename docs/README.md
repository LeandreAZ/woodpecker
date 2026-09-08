# Documentation technique — Woodpecker Trainer 1.0.0

Ce dossier est la référence technique, fonctionnelle et pédagogique de Woodpecker Trainer.

Le `README.md` racine est volontairement une porte d'entrée : présentation, installation rapide, commandes et aperçu de la stack. Ici, l'objectif est différent : permettre de **comprendre le projet jusque dans ses détails**, de le reprendre après plusieurs mois, d'expliquer ses choix et de le modifier sans dépendre de connaissances implicites.

## Philosophie

Chaque sujet important est documenté à six niveaux :

1. **Comprendre** : définition simple du concept.
2. **Dans Woodpecker** : fichiers, classes, hooks, routes et tables réellement concernés.
3. **Fonctionnement interne** : flux détaillé du navigateur jusqu'à PostgreSQL.
4. **Pourquoi** : avantages, inconvénients, choix et alternatives.
5. **Modifier / maintenir** : où intervenir, risques et tests.
6. **Pièges / subtilités** : comportements faciles à mal interpréter.

Cette organisation est notamment indispensable pour le Solver : une tentative n'est pas un coup, un premier échec marque le `CyclePuzzle` comme `failed`, une résolution ultérieure constitue un rattrapage, et `clientRequestId` protège la synchronisation des tentatives.

## Parcours de lecture

### Installer et lancer

- [Installation](getting-started/installation.md)
- [Configuration](getting-started/configuration.md)
- [Variables d'environnement](getting-started/environment-variables.md)
- [Docker](getting-started/docker.md)
- [Premiers pas](getting-started/first-steps.md)

### Comprendre le domaine

- [Vue d'ensemble](project/overview.md)
- [Règles métier](project/business-rules.md)
- [Architecture](project/architecture.md)
- [Modèle de données](project/data-model.md)
- [Flux applicatifs](project/application-flow.md)
- [Histoire technique](project/history-and-evolution.md)

### Comprendre le Solver

- [Cycles Woodpecker](features/woodpecker-cycles.md)
- [Tentatives et résultats](features/attempts-and-results.md)
- [Moteur Solver](features/solver-engine.md)
- [Page frontend Solver](frontend/pages/solver.md)
- [ReadModels](backend/read-models.md)

### Modifier le projet

- [Arborescence](project/folder-structure.md)
- [Ajouter une feature](maintenance/adding-a-feature.md)
- [Modifier la base](maintenance/modifying-the-database.md)
- [Debugging](maintenance/debugging.md)
- [Tests](testing/overview.md)

## Carte documentaire

- `getting-started/` — installation, configuration et environnement ;
- `project/` — domaine, architecture et modèle de données ;
- `frontend/` — React, routing, données serveur, composants et pages ;
- `backend/` — Symfony, API Platform, Doctrine, sécurité, ReadModels ;
- `features/` — fonctionnalités suivies de bout en bout ;
- `testing/` — stratégie et environnements de tests ;
- `stack/` — technologies expliquées comme un cours appliqué au projet ;
- `decisions/` — raisons, alternatives et compromis ;
- `maintenance/` — procédures de modification et release ;
- `reference/` — index exhaustifs (classes, fichiers, dépendances, tests, contrats) ;
- `quality/` — uniquement les preuves/rapports réellement utiles après nettoyage.

## État certifié de la v1

- 95 tests backend / 694 assertions ;
- 114 tests frontend ;
- 13/13 scénarios Playwright E2E ;
- ESLint sans erreur ;
- build frontend validé ;
- audits npm et Composer propres lors de la certification ;
- smoke Docker / HTTP / SQL validé.

Ces nombres sont historiques à la release v1.0.0 : s'ils évoluent, mettre ce fichier à jour.

## Limites connues

### Sécurité
- JWT stocké dans `localStorage` : solution fonctionnelle mais moins robuste face à un XSS qu'un cookie HttpOnly correctement conçu ;
- pas de throttling de connexion avancé documenté ;
- headers Nginx/CSP perfectibles ;
- permissions très permissives du dossier avatar dans l'environnement de développement.

### Production
- stack Compose orientée développement ;
- frontend Vite dev plutôt qu'artefacts statiques optimisés ;
- observabilité minimale ;
- secrets de production à externaliser.

### Frontend
- quelques warnings ESLint connus ;
- bundle Vite encore optimisable ;
- routeur maison volontairement simple.

### Fonctionnel
- pas de récupération de mot de passe ;
- catalogue Lichess local à synchroniser ;
- Woodpecker n'est pas un moteur d'analyse type Stockfish.

## Règle de maintenance

Une modification métier significative doit mettre à jour :
- le document `features/` concerné ;
- la page frontend si l'UI change ;
- le chapitre backend si le contrat/persistance change ;
- les tests ;
- les décisions si le choix d'architecture évolue.

La source de vérité est le **code final** et la documentation versionnée.
