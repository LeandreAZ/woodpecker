<?php

namespace App\Repository;

use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TrainingPuzzle>
 */
class TrainingPuzzleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TrainingPuzzle::class);
    }

    /**
     * @return list<TrainingPuzzle>
     */
    public function findByTrainingWithPuzzleOrdered(Training $training): array
    {
        return $this->createQueryBuilder('trainingPuzzle')
            ->addSelect('puzzle')
            ->innerJoin('trainingPuzzle.puzzle', 'puzzle')
            ->andWhere('trainingPuzzle.training = :training')
            ->setParameter('training', $training)
            ->orderBy('trainingPuzzle.position', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
