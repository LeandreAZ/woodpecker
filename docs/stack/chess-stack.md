# Stack échiquéenne

## FEN

Forsyth–Edwards Notation décrit une position :
- placement des pièces ;
- trait ;
- roques ;
- en passant ;
- demi-coups ;
- numéro de coup.

La FEN est l'état initial du puzzle.

## UCI move

Format compact `from + to + promotion éventuelle`.

Exemples :
- `e2e4`
- `e7e8q`.

La solution Woodpecker est un tableau de coups UCI.

## chess.js

Version : `1.4.0`.

Utilisé pour :
- charger FEN ;
- vérifier coups légaux ;
- faire évoluer la position ;
- validation de séquences.

## react-chessboard

Version : `5.10.0`.

Rendu/interaction visuelle de l'échiquier. Il ne remplace pas chess.js pour la légalité.

## chess.php

Backend Composer : `v2.2.0`.

Utilisé côté serveur pour les validations échiquéennes nécessaires aux imports.

## Dataset Lichess

Fournit positions, moves, rating, thèmes et métadonnées. Woodpecker l'indexe localement au lieu d'en faire une dépendance réseau à chaque import.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
