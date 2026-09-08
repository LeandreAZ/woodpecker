# Histoire technique du projet

Ce chapitre utilise l'ancien historique Git **uniquement comme contexte**. La branche actuelle contient de très nombreux changements non commités après un checkpoint ; elle ne doit donc pas être publiée telle quelle ni considérée comme une spécification.

## Grandes étapes observables

### Fin juillet 2026 — domaine Woodpecker

L'historique montre la construction progressive de :
- puzzles d'entraînement ;
- tolérance/erreurs ;
- progression de cycle ;
- historique ;
- complétion automatique ;
- reprise d'un cycle actif ;
- prévention de cycles actifs dupliqués ;
- verrouillage de la collection après démarrage.

Cette séquence explique pourquoi les invariants Cycle/TrainingPuzzle sont aujourd'hui fortement protégés côté backend.

### Début août — architecture frontend et ownership

Le projet ajoute progressivement :
- tests backend ciblés ;
- durcissement ownership ;
- routeur applicatif ;
- endpoint `training overview` ;
- validations puzzle/CSV ;
- extraction de vues ;
- refactor du panneau Trainings.

### Mi/fin août — statistiques et Solver

Plusieurs commits concernent :
- refonte Detail/Solver ;
- correctifs de prise en compte des coups ;
- feedback visuel ;
- statistiques globales ;
- branding persistant ;
- persistance fiable du Solver avec Attempts/autosave.

Le commit historique `f800d47` (« refactor solver persistence with attempts and reliable autosave ») constitue un jalon utile pour comprendre l'origine du modèle Attempt et de la persistance locale.

### Fin août — stabilisation Settings / History

Des checkpoints montrent la stabilisation simultanée de paramètres, historique et Solver.

### Début septembre — imports

Le commit `cc42c15` finalise les imports Lichess et CSV avant la grande passe de refactor/documentation.

### 6 septembre — refactor d'architecture

Le `HEAD` historique est un checkpoint avant refactor. Le worktree final contient ensuite notamment :
- ReadModels extraits ;
- features frontend découpées ;
- E2E Playwright ;
- correctifs CSV cache ;
- durcissements sécurité ;
- certification finale.

## Pourquoi cette histoire est utile ?

Elle aide à distinguer :
- une règle métier volontaire d'un hasard d'implémentation ;
- un ancien bug d'une limitation actuelle ;
- le code final de documents de travail obsolètes.

## Pourquoi ne pas publier l'ancien historique tel quel ?

Le worktree final repose sur un grand nombre de changements post-checkpoint. La reconstruction Git prévue doit raconter le projet avec environ trente commits logiques représentant le **code réellement final**, sans inventer de fausses fonctionnalités.

La documentation cite donc toujours le code final comme source de vérité et utilise l'historique uniquement comme explication secondaire.
