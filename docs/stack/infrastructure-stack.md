# Stack infrastructure

## Docker

Reproductibilité et isolation.

## Compose

Décrit plusieurs services comme une application cohérente.

## Nginx

Serveur HTTP/reverse proxy. Il sert de frontière devant PHP-FPM.

## PHP-FPM

Gestionnaire de processus FastCGI pour exécuter PHP.

## Node.js

Runtime du tooling frontend/Vite, version 24 dans l'image.

## Alpine

Images Linux compactes pour PostgreSQL/Nginx/Node. Elles réduisent la taille mais peuvent parfois demander des paquets spécifiques.

## Réseau interne

Les services se trouvent par DNS Compose. Le port publié n'est nécessaire que pour l'hôte.

## Volumes

Séparent persistance et cycle de vie des conteneurs :
- PostgreSQL ;
- vendor ;
- node_modules ;
- JWT.

## Production

La stack actuelle est une stack de développement : en production, on construirait normalement le frontend, on utiliserait des secrets externes, des permissions plus strictes, healthchecks/monitoring et sauvegardes.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
