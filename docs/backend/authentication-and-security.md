# Authentification et sécurité

## Inscription

`POST /api/users` est public. Le `UserPasswordHasherProcessor` transforme `plainPassword` en hash avant persistance.

Le mot de passe brut n'est pas une colonne persistée.

## Login

`POST /api/login_check` est géré par le firewall `login` :
- `username_path: email`
- `password_path: password`
- handler LexikJWT en succès/échec.

## JWT

Un JWT signé permet au backend de vérifier l'authenticité du token sans session serveur.

Le frontend envoie :

```http
Authorization: Bearer <token>
```

## Clés asymétriques

- clé privée : signature ;
- clé publique : vérification.

La clé privée ne doit jamais être commitée.

## Firewall API

`^/api` est stateless et utilise JWT.

## `access_control`

Ordre important : **la première règle correspondante gagne**.

Public :
- login ;
- `POST /api/users` ;
- documentation API/contextes.

Tout le reste de `/api` demande `IS_AUTHENTICATED_FULLY`.

## CORS

NelmioCors gère l'autorisation navigateur d'appeler l'API depuis une origine différente. CORS ne remplace pas l'authentification.

## Expiration

Le frontend transforme un `401` authentifié en événement `woodpecker:unauthorized`, efface la session et redirige vers Auth.

## Limites v1

Le stockage JWT dans `localStorage` simplifie l'application mais augmente l'importance de prévenir les XSS. Une production plus ambitieuse pourrait étudier un cookie HttpOnly/SameSite/CSRF adapté.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
