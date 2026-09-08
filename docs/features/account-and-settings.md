# Compte et paramètres

## Overview

`GET /api/users/me/overview` retourne une vue regroupée :
- identité ;
- profil ;
- apparence ;
- échiquier ;
- préférences Solver.

## Profil

Le pseudonyme existe indépendamment de l'e-mail. Un pseudonyme par défaut est généré si nécessaire.

## Avatar

`POST /api/users/me/avatar` :
- limite 2 Mo ;
- accepte JPEG/PNG/WebP ;
- valide le MIME côté serveur ;
- écrit dans `public/uploads/avatars`;
- met à jour `avatarUrl`.

Les fichiers runtime sont ignorés par Git.

## Email

`PUT /api/users/me/email` exige le mot de passe actuel.

## Mot de passe

`PUT /api/users/me/password` vérifie ancien mot de passe, longueur >= 8 et confirmation.

## Suppression compte

`DELETE /api/users/me` demande e-mail de confirmation + mot de passe.

## Préférences

`UserPreference` stocke :
- displayName ;
- language ;
- theme ;
- couleurs échiquier ;
- showLegalMoves ;
- showCoordinates ;
- animateMoves ;
- showRightClickTargets.

## Pourquoi persister en DB ?

Les paramètres suivent le compte entre navigateurs, contrairement à un simple localStorage.

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

- `frontend/src/features/settings/pages/SettingsView.test.tsx`
- `frontend/e2e/settings.spec.ts`
