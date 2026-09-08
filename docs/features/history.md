# Historique

## Deux sources d'événements

`HistoryOverviewReader` fusionne :
- Attempts terminées ;
- `AuthenticationEvent` login/logout.

## Attempts

Un item contient notamment :
- training ;
- cycle ;
- puzzle ;
- attempt number ;
- statut ;
- date ;
- durée ;
- détail.

Les Attempts `in_progress` ne doivent pas polluer l'historique final comme si elles étaient terminées.

## Auth events

`AuthenticationEventRecorder` détecte :
- plateforme ;
- navigateur ;
- appareil ;
- raison de logout ;
- fingerprint token.

## Frontend

La feature History fournit :
- filters ;
- table ;
- timeline ;
- pagination ;
- badges statut ;
- formatting.

## Pourquoi un ReadModel global ?

Le frontend reçoit une timeline déjà homogénéisée au lieu de charger deux collections puis de refaire le tri et la normalisation.

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

- `frontend/src/features/history/pages/HistoryView.test.tsx`
