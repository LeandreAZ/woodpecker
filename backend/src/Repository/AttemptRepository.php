<?php

namespace App\Repository;

use App\Entity\Attempt;
use App\Entity\CyclePuzzle;
use App\Entity\Training;
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
        return $this->hasAttemptWithStatus($cyclePuzzle, 'solved');
    }

    public function hasSolvedAttemptForCyclePuzzle(CyclePuzzle $cyclePuzzle, ?Attempt $excludingAttempt = null): bool
    {
        return $this->hasAttemptWithStatus($cyclePuzzle, 'solved', $excludingAttempt);
    }

    public function hasFailedAttemptForCyclePuzzle(CyclePuzzle $cyclePuzzle, ?Attempt $excludingAttempt = null): bool
    {
        return $this->hasAttemptWithStatus($cyclePuzzle, 'failed', $excludingAttempt);
    }

    public function findActiveAttemptForCyclePuzzle(CyclePuzzle $cyclePuzzle): ?Attempt
    {
        return $this->createQueryBuilder('attempt')
            ->andWhere('attempt.cyclePuzzle = :cyclePuzzle')
            ->andWhere('attempt.status = :status')
            ->setParameter('cyclePuzzle', $cyclePuzzle)
            ->setParameter('status', 'in_progress')
            ->orderBy('attempt.attemptNumber', 'DESC')
            ->addOrderBy('attempt.id', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function countCompletedAttemptsForCyclePuzzle(CyclePuzzle $cyclePuzzle): int
    {
        return (int) $this->createQueryBuilder('attempt')
            ->select('COUNT(attempt.id)')
            ->andWhere('attempt.cyclePuzzle = :cyclePuzzle')
            ->andWhere('attempt.status IN (:statuses)')
            ->setParameter('cyclePuzzle', $cyclePuzzle)
            ->setParameter('statuses', ['failed', 'solved'])
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function sumDurationsForCyclePuzzle(CyclePuzzle $cyclePuzzle): int
    {
        return (int) $this->createQueryBuilder('attempt')
            ->select('COALESCE(SUM(attempt.durationMilliseconds), 0)')
            ->andWhere('attempt.cyclePuzzle = :cyclePuzzle')
            ->setParameter('cyclePuzzle', $cyclePuzzle)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function getNextAttemptNumberForCyclePuzzle(CyclePuzzle $cyclePuzzle): int
    {
        $highestAttemptNumber = (int) $this->createQueryBuilder('attempt')
            ->select('COALESCE(MAX(attempt.attemptNumber), 0)')
            ->andWhere('attempt.cyclePuzzle = :cyclePuzzle')
            ->setParameter('cyclePuzzle', $cyclePuzzle)
            ->getQuery()
            ->getSingleScalarResult();

        return $highestAttemptNumber + 1;
    }

    public function findLatestCompletedAtForCyclePuzzle(CyclePuzzle $cyclePuzzle): ?\DateTimeImmutable
    {
        $value = $this->createQueryBuilder('attempt')
            ->select('attempt.completedAt')
            ->andWhere('attempt.cyclePuzzle = :cyclePuzzle')
            ->andWhere('attempt.completedAt IS NOT NULL')
            ->setParameter('cyclePuzzle', $cyclePuzzle)
            ->orderBy('attempt.completedAt', 'DESC')
            ->addOrderBy('attempt.id', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if (is_array($value)) {
            $value = array_values($value)[0] ?? null;
        }

        return $value instanceof \DateTimeImmutable ? $value : null;
    }

    public function findOneByClientRequestId(string $clientRequestId): ?Attempt
    {
        return $this->createQueryBuilder('attempt')
            ->andWhere('attempt.clientRequestId = :clientRequestId')
            ->setParameter('clientRequestId', $clientRequestId)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return list<Attempt>
     */
    public function findByTrainingOrdered(Training $training): array
    {
        return $this->createQueryBuilder('attempt')
            ->innerJoin('attempt.trainingSession', 'trainingSession')
            ->addSelect('trainingSession')
            ->andWhere('trainingSession.training = :training')
            ->setParameter('training', $training)
            ->orderBy('attempt.attemptedAt', 'DESC')
            ->addOrderBy('attempt.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    private function hasAttemptWithStatus(CyclePuzzle $cyclePuzzle, string $status, ?Attempt $excludingAttempt = null): bool
    {
        $queryBuilder = $this->createQueryBuilder('attempt')
            ->select('attempt.id')
            ->andWhere('attempt.cyclePuzzle = :cyclePuzzle')
            ->andWhere('attempt.status = :status')
            ->setParameter('cyclePuzzle', $cyclePuzzle)
            ->setParameter('status', $status)
            ->setMaxResults(1);

        if ($excludingAttempt instanceof Attempt && null !== $excludingAttempt->getId()) {
            $queryBuilder
                ->andWhere('attempt.id != :excludedAttemptId')
                ->setParameter('excludedAttemptId', $excludingAttempt->getId());
        }

        return null !== $queryBuilder->getQuery()->getOneOrNullResult();
    }
}
