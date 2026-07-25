<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Attempt;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\TrainingSession;
use App\Entity\User;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

final class CurrentUserTrainingScopeExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(
        private readonly Security $security,
    ) {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $this->addCurrentUserScope($queryBuilder, $queryNameGenerator, $resourceClass);
    }

    public function applyToItem(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, array $identifiers, ?Operation $operation = null, array $context = []): void
    {
        $this->addCurrentUserScope($queryBuilder, $queryNameGenerator, $resourceClass);
    }

    private function addCurrentUserScope(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass): void
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0] ?? null;

        if (null === $rootAlias) {
            return;
        }

        if (Training::class === $resourceClass) {
            $this->restrictAliasToOwner($queryBuilder, $queryNameGenerator, $rootAlias, $user);

            return;
        }

        $associationPath = $this->associationPathToTraining($resourceClass);

        if (null === $associationPath) {
            return;
        }

        $trainingAlias = $this->joinAssociationPath($queryBuilder, $queryNameGenerator, $rootAlias, $associationPath);
        $this->restrictAliasToOwner($queryBuilder, $queryNameGenerator, $trainingAlias, $user);
    }

    /**
     * @return list<string>|null
     */
    private function associationPathToTraining(string $resourceClass): ?array
    {
        return match ($resourceClass) {
            TrainingPuzzle::class, Cycle::class, TrainingSession::class => ['training'],
            CyclePuzzle::class => ['cycle', 'training'],
            Attempt::class => ['trainingSession', 'training'],
            default => null,
        };
    }

    /**
     * @param list<string> $associationPath
     */
    private function joinAssociationPath(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $rootAlias, array $associationPath): string
    {
        $currentAlias = $rootAlias;

        foreach ($associationPath as $association) {
            $joinAlias = $queryNameGenerator->generateJoinAlias($association);
            $queryBuilder->innerJoin(sprintf('%s.%s', $currentAlias, $association), $joinAlias);
            $currentAlias = $joinAlias;
        }

        return $currentAlias;
    }

    private function restrictAliasToOwner(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $trainingAlias, User $user): void
    {
        $parameterName = $queryNameGenerator->generateParameterName('current_user');

        $queryBuilder
            ->andWhere(sprintf('%s.owner = :%s', $trainingAlias, $parameterName))
            ->setParameter($parameterName, $user);
    }
}
