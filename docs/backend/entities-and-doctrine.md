# Doctrine ORM et entités

## ORM

Un Object-Relational Mapper traduit entre objets PHP et tables SQL.

Dans Woodpecker :
- classe `Training` ↔ table `training` ;
- propriété scalaire ↔ colonne ;
- `ManyToOne` ↔ clé étrangère ;
- Collection Doctrine ↔ relation inverse.

## EntityManager

L'EntityManager suit les entités gérées :
- `persist()` programme une insertion pour une nouvelle entité ;
- modifier un objet géré suffit souvent pour programmer un UPDATE ;
- `flush()` synchronise l'Unit of Work avec PostgreSQL.

## Repository

Un repository encapsule les requêtes liées à une entité. Exemple `AttemptRepository` fournit des requêtes métier :
- tentative active ;
- présence d'un succès/échec ;
- prochain numéro ;
- durée totale ;
- recherche par `clientRequestId`.

## Relations

### ManyToOne
Plusieurs `Training` peuvent appartenir chacun à un `User`, donc côté Training : `ManyToOne owner`.

### OneToMany
Côté User, `trainings` est la collection inverse.

### Association explicite
`TrainingPuzzle` n'est pas une simple ManyToMany automatique car l'association porte des données propres comme `position` et `personalNote`.

## Lifecycle callbacks

Des entités initialisent automatiquement timestamps ou dates via `PrePersist`/`PreUpdate`.

## Pourquoi garder les invariants aussi dans les services/processors ?

Une validation d'entité seule ne suffit pas pour une règle dépendant d'autres lignes, comme « un seul cycle actif par entraînement » ou « liste verrouillée après le premier cycle ».

## Comment modifier sans casser le reste

1. identifier la règle métier avant de modifier l'UI ;
2. vérifier si le contrat API doit réellement changer ;
3. conserver l'ownership et les validations côté serveur ;
4. mettre à jour les types frontend en même temps que la réponse backend ;
5. invalider les bonnes queries TanStack Query après une mutation ;
6. exécuter les tests ciblés puis la validation plus large adaptée à l'impact.

## Ce qu'il faut retenir

La documentation décrit l'état **actuel** de Woodpecker `1.0.0` et doit rester synchronisée avec le code final.
