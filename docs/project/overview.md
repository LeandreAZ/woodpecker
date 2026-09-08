# Vue d'ensemble de Woodpecker Trainer

## Problème

La Woodpecker Method repose sur la répétition d'un corpus relativement fixe de tactiques. La plupart des interfaces de puzzles mettent surtout en avant un flux de positions différentes. Woodpecker Trainer modélise explicitement un corpus, des cycles, des essais et une progression.

## Cas d'usage

Un utilisateur peut :
- créer plusieurs entraînements indépendants ;
- leur donner une identité visuelle ;
- ajouter des puzzles ;
- importer via CSV ;
- générer une sélection depuis un catalogue Lichess local ;
- répéter la collection sur plusieurs cycles ;
- résoudre sur un échiquier interactif ;
- conserver chaque tentative ;
- analyser les résultats par cycle et globalement.

## Grandes briques

- React/TypeScript : interaction navigateur ;
- Symfony/API Platform : API et règles ;
- Doctrine/PostgreSQL : persistance ;
- Docker/Nginx/PHP-FPM : environnement ;
- chess.js/react-chessboard : logique et rendu échiquéens ;
- PHPUnit/Vitest/Playwright : validation.

## Frontières

Woodpecker ne cherche pas à être :
- un moteur d'analyse ;
- un serveur de parties ;
- une base de données distante Lichess en temps réel ;
- un remplacement complet de Lichess/Chess.com.

Il est spécialisé dans la **répétition mesurable d'une collection tactique**.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
