# Ajouter une fonctionnalité

## 1. Écrire la règle avant le code

Définir :
- utilisateur concerné ;
- données ;
- ownership ;
- invariants ;
- erreurs ;
- interactions avec cycles/stats/history.

## 2. Modèle

Si persistance nécessaire :
- modifier/créer Entity ;
- migration ;
- repository si query spécifique.

## 3. Backend

Choisir :
- API Platform CRUD si ressource simple ;
- processor si invariant de persistance ;
- controller/service si opération métier ;
- ReadModel si lecture d'écran agrégée.

## 4. Frontend

Créer dans `features/<feature>` :
- types ;
- query ;
- mutation/action ;
- composants ;
- page ;
- styles.

Mettre dans `shared` uniquement ce qui est réellement transversal.

## 5. Cache

Définir les query keys et les invalidations exactes.

## 6. Tests

- backend pour règle ;
- frontend pour interaction ;
- E2E seulement si le parcours traverse réellement plusieurs couches critiques.

## 7. Documentation

Mettre à jour feature + pages/backend/decision selon impact.

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
