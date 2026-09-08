# Processus de release

## SemVer

`MAJOR.MINOR.PATCH`

- PATCH : correction compatible ;
- MINOR : fonctionnalité compatible ;
- MAJOR : changement incompatible.

## Avant release

1. code gelé ;
2. versions harmonisées ;
3. aucun runtime/secrets trackés ;
4. tests ciblés + campagne complète ;
5. audits ;
6. build ;
7. docs ;
8. `git diff --check`.

## Git

La v1 actuelle doit être publiée après reconstruction d'un historique propre et logique, pas en conservant le worktree/checkpoints historiques tels quels.

## Tag

```bash
git tag -a v1.0.0 -m "Woodpecker Trainer v1.0.0"
git push origin v1.0.0
```

À exécuter seulement après validation finale.

## Release GitHub

Résumé :
- fonctionnalités ;
- installation ;
- tests ;
- limites ;
- éventuellement captures.

## Prochaine version

Ne modifier pas une migration/tag v1 déjà publié. Créer des commits et migrations nouveaux.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
