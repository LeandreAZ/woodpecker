<?php

namespace App\Repository;

use App\Entity\Training;
use App\Entity\TrainingSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TrainingSession>
 */
class TrainingSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TrainingSession::class);
    }

    /**
     * @return list<TrainingSession>
     */
    public function findByTrainingOrdered(Training $training): array
    {
        return $this->createQueryBuilder('trainingSession')
            ->andWhere('trainingSession.training = :training')
            ->setParameter('training', $training)
            ->orderBy('trainingSession.startedAt', 'ASC')
            ->addOrderBy('trainingSession.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
