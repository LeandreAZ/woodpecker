<?php

namespace App\Repository;

use App\Entity\AuthenticationEvent;
use App\Entity\User;
use App\Enum\AuthenticationEventType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AuthenticationEvent>
 */
class AuthenticationEventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AuthenticationEvent::class);
    }

    /**
     * @return list<AuthenticationEvent>
     */
    public function findByUserOrdered(User $user): array
    {
        return $this->createQueryBuilder('authenticationEvent')
            ->andWhere('authenticationEvent.user = :user')
            ->setParameter('user', $user)
            ->orderBy('authenticationEvent.createdAt', 'DESC')
            ->addOrderBy('authenticationEvent.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByTokenFingerprint(string $tokenFingerprint): ?AuthenticationEvent
    {
        return $this->findOneBy(['tokenFingerprint' => $tokenFingerprint]);
    }

    public function findLatestByUserAndType(User $user, AuthenticationEventType $type): ?AuthenticationEvent
    {
        return $this->createQueryBuilder('authenticationEvent')
            ->andWhere('authenticationEvent.user = :user')
            ->andWhere('authenticationEvent.type = :type')
            ->setParameter('user', $user)
            ->setParameter('type', $type->value)
            ->orderBy('authenticationEvent.createdAt', 'DESC')
            ->addOrderBy('authenticationEvent.id', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
