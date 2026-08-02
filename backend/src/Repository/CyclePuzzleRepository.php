<?php

namespace App\Repository;

use App\Entity\CyclePuzzle;
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
}
