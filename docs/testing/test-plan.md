# Plan de tests de référence

## Objectif

Valider les règles métier et les parcours critiques sans dupliquer inutilement les mêmes assertions à tous les niveaux.

## Authentification

À protéger :
- inscription ;
- login correct/incorrect ;
- JWT nécessaire aux routes privées ;
- expiration/401 ;
- logout ;
- ownership inter-utilisateur.

## Trainings

- création ;
- édition ;
- suppression ;
- détail ;
- collection ;
- verrouillage après premier cycle ;
- cycle actif unique ;
- reprise d'un cycle.

## Solver

Scénarios indispensables :
- puzzle direct ;
- erreur initiale ;
- tentative suivante réussie = rescued ;
- non résolu ;
- multi-cycle ;
- durée ;
- numéro de tentative ;
- aucune duplication concurrente ;
- `clientRequestId` idempotent ;
- refresh/navigation/pending persistence.

## Imports

### CSV
- fichier valide ;
- erreur ;
- doublon fichier ;
- doublon Training ;
- analyze puis import ;
- `analysisId` expiré ;
- skip flags.

### Lichess
- options ;
- disponibilité ;
- rating ;
- thèmes ;
- min/max moves ;
- distribution custom ;
- insuffisance de résultats.

## History / Statistics

Vérifier la sémantique :
- direct ;
- rescued ;
- unresolved ;
- distribution d'essais ;
- progression par cycle ;
- filtrage History ;
- auth events.

## Settings

- profil ;
- thème ;
- couleurs échiquier ;
- solver preferences ;
- avatar ;
- email ;
- password ;
- suppression compte.

## Responsive / navigation

- mobile ;
- routes dynamiques ;
- 404 ;
- back/forward ;
- page refresh sur route profonde.

## Checklist manuelle complémentaire

Avant une release, compléter les suites automatisées par une vérification visuelle ciblée :

- parcourir Dashboard, détail d'entraînement, import, Solver, History, Statistics et Settings ;
- vérifier les routes profondes, le rafraîchissement, le retour/avance et la route 404 ;
- contrôler les états loading, vide et erreur des pages principales ;
- vérifier la cohérence des compteurs, statuts, durées et actions avec des données réelles ;
- tester au minimum une largeur desktop et une largeur mobile proche de 390 px ;
- confirmer l'absence de débordement horizontal, de texte tronqué et de contrôle inaccessible ;
- vérifier sur le véritable échiquier les préférences Solver, une résolution directe, un échec puis un rattrapage ;
- contrôler l'analyse CSV, ses erreurs, ses doublons et le verrouillage de la collection après le premier cycle.

Consigner pour toute anomalie la page, la largeur, l'action, le résultat observé, le résultat attendu et, si utile, une capture.

## Répartition par niveau

- PHPUnit : invariants backend/calculs/sécurité ;
- Vitest : composants/hooks/formatage ;
- Playwright : intégration des parcours ;
- smoke : disponibilité et cohérence stack.

## Certification v1

Référence historique :
- backend 95 tests / 694 assertions ;
- frontend 114 tests ;
- Playwright 13/13 sans retry dans la campagne finale.
