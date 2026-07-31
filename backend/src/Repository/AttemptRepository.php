<?php

namespace App\Repository;

use App\Entity\Attempt;
use App\Entity\CyclePuzzle;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Attempt>
 */
class AttemptRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Attempt::class);
    }

    public function hasSuccessfulAttemptForCyclePuzzle(CyclePuzzle $cyclePuzzle): bool
    {
        return null !== $this->createQueryBuilder('attempt')
            ->select('attempt.id')
            ->andWhere('attempt.cyclePuzzle = :cyclePuzzle')
            ->andWhere('attempt.successful = true')
            ->setParameter('cyclePuzzle', $cyclePuzzle)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
