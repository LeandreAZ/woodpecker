# Client API frontend

## Fichier

`frontend/src/shared/api/client.ts`.

## URL de base

```ts
import.meta.env.VITE_API_BASE_URL ?? '/api'
```

## `apiRequest<T>()`

Responsabilités :
- construire les headers ;
- `Accept: application/ld+json` ;
- Content-Type JSON-LD par défaut si body ;
- ajouter Bearer token ;
- appeler `fetch` ;
- transformer erreurs réseau ;
- transformer erreurs HTTP ;
- parser JSON ;
- gérer `204`.

## `apiMultipartRequest<T>()`

Variante pour `FormData`. Elle **ne fixe pas manuellement** `Content-Type`, car le navigateur doit générer la boundary multipart correcte.

## `NetworkError`

Distingue une absence de communication du serveur d'une réponse HTTP d'erreur.

## `ApiError`

Conserve le status HTTP.

## 401

Si une requête possédant un token reçoit 401, le client émet `woodpecker:unauthorized`.

## Messages

Les erreurs serveur 5xx utilisent volontairement des messages génériques côté UI ; les 4xx peuvent exposer le `detail` API utile à la validation.

## Pourquoi centraliser ?

Sans client commun, chaque feature répéterait token, parsing, gestion 401 et messages.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.

## Tests directement associés

- `frontend/src/shared/api/client.test.ts`
