<?php

namespace App\Repository;

use App\Entity\Cycle;
use App\Entity\Training;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Cycle>
 */
class CycleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Cycle::class);
    }

    public function hasActiveCycleForTraining(Training $training, ?Cycle $excludedCycle = null): bool
    {
        $queryBuilder = $this->createQueryBuilder('cycle')
            ->select('COUNT(cycle.id)')
            ->andWhere('cycle.training = :training')
            ->andWhere('cycle.status = :status')
            ->setParameter('training', $training)
            ->setParameter('status', 'active');

        if (null !== $excludedCycle?->getId()) {
            $queryBuilder
                ->andWhere('cycle.id != :excludedCycleId')
                ->setParameter('excludedCycleId', $excludedCycle->getId());
        }

        return (int) $queryBuilder->getQuery()->getSingleScalarResult() > 0;
    }

    public function hasCycleForTraining(Training $training): bool
    {
        return (int) $this->createQueryBuilder('cycle')
            ->select('COUNT(cycle.id)')
            ->andWhere('cycle.training = :training')
            ->setParameter('training', $training)
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }
}
