# Premiers pas fonctionnels

## Parcours conseillé

1. créer un compte depuis `/auth` ;
2. créer un entraînement via `/trainings/new` ;
3. importer une collection CSV ou Lichess ;
4. démarrer un premier cycle ;
5. résoudre dans `/trainings/:id/solver` ;
6. consulter le détail de l'entraînement ;
7. comparer History et Statistics ;
8. personnaliser le compte et l'échiquier dans Settings.

## Comprendre le résultat d'un puzzle

Le vocabulaire est essentiel :
- **tentative** = essai complet sur un puzzle ;
- **coup** = un mouvement à l'intérieur d'une tentative ;
- **direct** = le puzzle a été résolu sans tentative échouée ;
- **rescued/rattrapé** = une tentative a échoué puis une autre a résolu le puzzle ;
- **unresolved/non résolu** = au moins un échec sans résolution ultérieure.

Le statut persistant d'un `CyclePuzzle` peut rester `failed` même s'il possède ensuite une tentative `solved`. Cette combinaison représente précisément le rattrapage.

## Pourquoi cette distinction ?

Elle permet de ne pas effacer l'information « j'ai eu besoin de plusieurs essais » tout en reconnaissant que le joueur a fini par trouver la solution.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
