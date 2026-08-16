<?php

namespace App\Repository;

use App\Entity\CyclePuzzle;
use App\Entity\Training;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CyclePuzzle>
 */
class CyclePuzzleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CyclePuzzle::class);
    }

    public function hasPendingCyclePuzzleForCycle(int $cycleId): bool
    {
        return (int) $this->createQueryBuilder('cyclePuzzle')
            ->select('COUNT(cyclePuzzle.id)')
            ->andWhere('cyclePuzzle.cycle = :cycleId')
            ->andWhere('cyclePuzzle.status = :status')
            ->setParameter('cycleId', $cycleId)
            ->setParameter('status', 'pending')
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }

    /**
     * @return list<CyclePuzzle>
     */
    public function findByTrainingOrdered(Training $training): array
    {
        return $this->createQueryBuilder('cyclePuzzle')
            ->innerJoin('cyclePuzzle.cycle', 'cycle')
            ->addSelect('cycle')
            ->andWhere('cycle.training = :training')
            ->setParameter('training', $training)
            ->orderBy('cycle.number', 'ASC')
            ->addOrderBy('cyclePuzzle.position', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
