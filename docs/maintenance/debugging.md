# Debugging

## 1. Identifier la couche

### Rien ne répond
`docker compose ps`.

### 502 / backend gateway
Vérifier `php` et Nginx. L'incident historique `host not found upstream php` venait de la disponibilité/résolution du service backend.

### Frontend démarre mal
Vérifier working directory `/app` et `package.json`. Un ancien `npm ENOENT` provenait d'un mauvais contexte de lancement.

### API 401
Vérifier token/expiration puis firewall.

### API 403/404 ownership
Vérifier que la ressource appartient bien au user courant.

### CSV « analyse expirée »
Vérifier `CsvAnalysisStore`, pool filesystem et cohérence `analysisId`.

### Solver duplique des essais
Tracer `clientRequestId`, Attempt active, requêtes concurrentes et merge backend.

### UI stats incohérente
Ne corriger pas uniquement le graphique : vérifier le ReadModel source et la définition direct/rescued/unresolved.

## Logs

```bash
docker compose logs -f php
docker compose logs -f nginx
docker compose logs -f frontend
docker compose logs -f database
```

## Réseau

Depuis PHP, PostgreSQL = `database:5432`, pas localhost.

## Cache frontend

TanStack Query peut montrer une donnée mise en cache. Vérifier query key, invalidation et optimistic update.

## Vite

Les anciens incidents de transform stale montrent qu'un problème d'outil peut ressembler à un problème CSS/code. Rebuild/restart seulement après avoir vérifié le diff.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
