<?php

namespace App\Repository;

use App\Entity\Training;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Training>
 */
class TrainingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Training::class);
    }

    public function findOneOwnedByUser(int $id, User $owner): ?Training
    {
        return $this->createQueryBuilder('training')
            ->andWhere('training.id = :id')
            ->andWhere('training.owner = :owner')
            ->setParameter('id', $id)
            ->setParameter('owner', $owner)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return list<Training>
     */
    public function findOwnedByUserOrdered(User $owner): array
    {
        return $this->createQueryBuilder('training')
            ->andWhere('training.owner = :owner')
            ->setParameter('owner', $owner)
            ->orderBy('training.updatedAt', 'DESC')
            ->addOrderBy('training.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
