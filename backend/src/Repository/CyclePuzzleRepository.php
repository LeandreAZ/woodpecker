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

    public function hasIncompleteCyclePuzzleForCycle(int $cycleId): bool
    {
        return (int) $this->createQueryBuilder('cyclePuzzle')
            ->select('COUNT(cyclePuzzle.id)')
            ->andWhere('cyclePuzzle.cycle = :cycleId')
            ->andWhere('cyclePuzzle.completedAt IS NULL')
            ->setParameter('cycleId', $cycleId)
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
            ->leftJoin('cyclePuzzle.attempts', 'attempts')
            ->addSelect('attempts')
            ->andWhere('cycle.training = :training')
            ->setParameter('training', $training)
            ->orderBy('cycle.number', 'ASC')
            ->addOrderBy('cyclePuzzle.position', 'ASC')
            ->addOrderBy('attempts.attemptNumber', 'ASC')
            ->addOrderBy('attempts.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
