# Cycle de vie d'une requête Symfony

## Exemple

Une requête `GET /api/trainings/12/summary` suit grossièrement :

```text
Nginx
 -> public/index.php
 -> Symfony Runtime / Kernel
 -> Router
 -> Security firewall
 -> API Platform operation
 -> TrainingSummaryAction
 -> ownership lookup
 -> TrainingSummaryReader
 -> repositories / Doctrine
 -> JsonResponse
```

## `public/index.php`

Front controller unique du backend. Il initialise le Runtime Symfony.

## Kernel

`App\Kernel` charge les bundles/configurations selon `APP_ENV`.

## Router

Deux sources de routes coexistent :
- métadonnées API Platform sur les entités ;
- attributs `#[Route]` sur les contrôleurs custom.

## Security

Les routes `/api` utilisent un firewall stateless JWT. La création de compte et le login sont explicitement publics.

## Controller / API Platform

API Platform peut gérer une opération directement ou déléguer à un contrôleur custom avec `read: false`.

## Services

Les contrôleurs doivent rester fins : les calculs importants sont placés dans services/ReadModels.

## Doctrine

Le manager suit les entités modifiées via Unit of Work. `flush()` traduit les changements en SQL.

## Réponse

L'API utilise principalement JSON-LD pour les ressources standard et `application/ld+json` pour plusieurs réponses custom.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
