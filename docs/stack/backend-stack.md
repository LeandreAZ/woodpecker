# Stack backend — cours appliqué

## PHP

Version d'image de développement : PHP 8.4 FPM. `composer.json` accepte `>=8.2`, mais Docker fige l'environnement réel du projet.

PHP exécute le domaine serveur. Alternative fréquente : Node/TypeScript, Java, Python, C#.

## Symfony

Version lockée : `v7.4.14`.

Framework structurant :
- routing ;
- DI ;
- security ;
- console ;
- validation ;
- configuration.

Alternative : Laravel (plus opinionated/application-oriented), Slim (plus minimal), Express/Nest côté Node.

## API Platform

Version : `v4.3.17`.

Accélère ressources REST, opérations, serializer et processors.

## Doctrine ORM

Version : `3.6.7`.

Évite d'écrire le CRUD SQL répétitif, gère relations/Unit of Work. Pour des requêtes analytiques spécifiques, le projet utilise quand même DBAL/SQL comme dans le catalogue Lichess.

## LexikJWTAuthenticationBundle

Version : `v3.2.0`.

Intègre l'émission/vérification JWT au firewall Symfony.

## NelmioCorsBundle

Version : `2.6.1`.

Gère CORS.

## Composer

Gestionnaire de dépendances PHP et lockfile reproductible.

## Pourquoi Symfony ici ?

Projet orienté apprentissage d'une architecture backend structurée, sécurité, Doctrine et API riche. Symfony rend explicites les couches et s'adapte bien à un domaine qui a grandi.

## Tradeoff

La contrepartie est plus de configuration/abstraction qu'un micro-framework.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
