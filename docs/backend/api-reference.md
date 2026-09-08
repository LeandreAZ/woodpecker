# Référence des endpoints importants

## Auth / compte

| Méthode | Endpoint | Rôle |
|---|---|---|
| POST | `/api/users` | inscription |
| POST | `/api/login_check` | login JWT |
| POST | `/api/auth/logout` | événement logout |
| GET | `/api/users/me/overview` | settings/profile courant |
| PUT | `/api/users/me/settings` | préférences |
| POST | `/api/users/me/avatar` | avatar |
| PUT | `/api/users/me/email` | changer e-mail |
| PUT | `/api/users/me/password` | changer mot de passe |
| DELETE | `/api/users/me` | supprimer compte |

## Trainings

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/api/trainings` | collection possédée |
| POST | `/api/trainings` | créer |
| GET/PATCH/DELETE | `/api/trainings/{id}` | ressource |
| GET | `/api/trainings/dashboard` | dashboard |
| GET | `/api/trainings/{id}/overview` | détail riche |
| GET | `/api/trainings/{id}/summary` | résumé stats |
| GET | `/api/trainings/{id}/analytics` | analytics |
| GET | `/api/trainings/{id}/attempt-history` | historique attempts |
| GET | `/api/trainings/{id}/cycle-history` | historique cycles |

## Global

- `GET /api/stats/overview`
- `GET /api/history/overview`

## Imports

- CSV analyze ;
- `POST /api/trainings/{id}/imports/csv` ;
- options/disponibilité Lichess ;
- `POST /api/trainings/{id}/imports/lichess`.

Les routes exactes d'options/analyze sont définies dans `TrainingPuzzleImportAction`; utiliser `debug:router` après toute modification.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
