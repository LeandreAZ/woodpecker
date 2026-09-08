# Configuration : qui configure quoi ?

## Les couches

Woodpecker sépare correctement plusieurs périmètres :

| Couche | Fichiers principaux | Consommateur |
|---|---|---|
| orchestration | `.env`, `.env.example`, `compose*.yaml` | Docker Compose |
| backend | `backend/.env`, `backend/config/` | Symfony |
| frontend | `frontend/.env.example`, `vite.config.ts` | Vite |
| serveur HTTP | `docker/nginx/default.conf` | Nginx |
| tests E2E | `compose.e2e.yaml`, `playwright.config.ts` | Docker + Playwright |

## Pourquoi plusieurs `.env` ?

Ils ne sont pas chargés par le même programme ni au même moment. Un seul fichier global obligerait Vite, Symfony et Compose à connaître des variables qui ne les concernent pas.

## Priorité importante

Dans Symfony, une vraie variable d'environnement du processus prend le dessus sur le fichier `.env`.

C'est exactement ce qui arrive pour `DATABASE_URL` :
- `backend/.env` contient une valeur de secours compatible avec une exécution native ;
- `compose.yaml` injecte une URL pointant vers le service Docker `database` ;
- dans le conteneur PHP, la valeur Compose gagne.

## Où changer une valeur ?

- port hôte : `.env` racine ;
- credentials PostgreSQL de développement : `.env` racine ;
- URL de base frontend : surcharge Vite dérivée de `frontend/.env.example` ;
- sécurité/routing/services Symfony : `backend/config/` ;
- préférence utilisateur : **base de données**, pas variable d'environnement.

## Secrets

Une valeur versionnée comme `APP_SECRET=woodpecker-dev-secret-change-me` est un **placeholder de développement**. Elle ne doit jamais être recyclée en production.

Les clés JWT réelles sont générées dans un volume Docker ignoré par Git.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
