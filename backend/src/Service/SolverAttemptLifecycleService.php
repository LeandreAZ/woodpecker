<?php

namespace App\Service;

use App\Entity\Attempt;
use App\Entity\CyclePuzzle;
use App\Enum\AttemptStatus;
use App\Enum\CyclePuzzleStatus;
use App\Repository\AttemptRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class SolverAttemptLifecycleService
{
    public function __construct(
        private readonly AttemptRepository $attemptRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly CycleCompletionService $cycleCompletionService,
    ) {
    }

    public function persistAttempt(Attempt $incomingAttempt): Attempt
    {
        $clientRequestId = trim((string) $incomingAttempt->getClientRequestId());
        $existingAttempt = '' !== $clientRequestId
            ? $this->attemptRepository->findOneByClientRequestId($clientRequestId)
            : null;

        $attempt = $existingAttempt ?? $incomingAttempt;
        $cyclePuzzle = $attempt->getCyclePuzzle() ?? $incomingAttempt->getCyclePuzzle();

        if (!$cyclePuzzle instanceof CyclePuzzle) {
            throw new ConflictHttpException('A cycle puzzle is required to persist a solver attempt.');
        }

        if ($this->isCyclePuzzleFrozen($cyclePuzzle, $attempt)) {
            if ($existingAttempt instanceof Attempt) {
                return $existingAttempt;
            }

            throw new ConflictHttpException('This cycle puzzle is already frozen for the current cycle.');
        }

        if ($existingAttempt instanceof Attempt) {
            $this->mergeAttempt($existingAttempt, $incomingAttempt);
            $attempt = $existingAttempt;
        } else {
            $this->initializeAttempt($incomingAttempt);
            $this->entityManager->persist($incomingAttempt);
            $attempt = $incomingAttempt;
        }

        $this->entityManager->flush();
        $this->refreshCyclePuzzleAggregate($cyclePuzzle);
        $this->entityManager->flush();

        return $attempt;
    }

    private function initializeAttempt(Attempt $attempt): void
    {
        $cyclePuzzle = $attempt->getCyclePuzzle();

        if (!$cyclePuzzle instanceof CyclePuzzle) {
            throw new ConflictHttpException('A cycle puzzle is required to create a solver attempt.');
        }

        if ($attempt->getAttemptNumber() <= 0) {
            $attempt->setAttemptNumber($this->attemptRepository->getNextAttemptNumberForCyclePuzzle($cyclePuzzle));
        }

        $attempt->setStatus($this->normalizeAttemptStatus($attempt->getStatus()));
        $attempt->setStartedAt($attempt->getStartedAt() ?? new \DateTimeImmutable());
        $attempt->setDurationMilliseconds(max(0, $attempt->getDurationMilliseconds()));
        $attempt->setMistakesCount(max(0, $attempt->getMistakesCount()));
        $attempt->setSuccessful(AttemptStatus::Solved->value === $attempt->getStatus());

        if (AttemptStatus::InProgress->value === $attempt->getStatus()) {
            $attempt->setCompletedAt(null);
        } else {
            $completedAt = $attempt->getCompletedAt() ?? new \DateTimeImmutable();
            $attempt->setCompletedAt($completedAt);
            $attempt->setAttemptedAt($attempt->getAttemptedAt() ?? $completedAt);
        }
    }

    private function mergeAttempt(Attempt $managedAttempt, Attempt $incomingAttempt): void
    {
        $currentStatus = $this->normalizeAttemptStatus($managedAttempt->getStatus());
        $incomingStatus = $this->normalizeAttemptStatus($incomingAttempt->getStatus());

        $managedAttempt->setPlayedMoves(
            count($incomingAttempt->getPlayedMoves()) >= count($managedAttempt->getPlayedMoves())
                ? $incomingAttempt->getPlayedMoves()
                : $managedAttempt->getPlayedMoves()
        );
        $managedAttempt->setDurationMilliseconds(max(
            $managedAttempt->getDurationMilliseconds(),
            $incomingAttempt->getDurationMilliseconds(),
        ));
        $managedAttempt->setMistakesCount(max(
            $managedAttempt->getMistakesCount(),
            $incomingAttempt->getMistakesCount(),
        ));
        $managedAttempt->setStartedAt($managedAttempt->getStartedAt() ?? $incomingAttempt->getStartedAt() ?? new \DateTimeImmutable());
        $managedAttempt->setAttemptNumber(max($managedAttempt->getAttemptNumber(), $incomingAttempt->getAttemptNumber()));

        if (AttemptStatus::InProgress->value !== $currentStatus) {
            return;
        }

        if (AttemptStatus::InProgress->value === $incomingStatus) {
            return;
        }

        $completedAt = $incomingAttempt->getCompletedAt() ?? new \DateTimeImmutable();

        $managedAttempt->setStatus($incomingStatus);
        $managedAttempt->setSuccessful(AttemptStatus::Solved->value === $incomingStatus);
        $managedAttempt->setCompletedAt($completedAt);
        $managedAttempt->setAttemptedAt($completedAt);
    }

    private function refreshCyclePuzzleAggregate(CyclePuzzle $cyclePuzzle): void
    {
        $completedAttemptCount = $this->attemptRepository->countCompletedAttemptsForCyclePuzzle($cyclePuzzle);
        $hasSolvedAttempt = $this->attemptRepository->hasSolvedAttemptForCyclePuzzle($cyclePuzzle);
        $hasFailedAttempt = $this->attemptRepository->hasFailedAttemptForCyclePuzzle($cyclePuzzle);
        $activeAttempt = $this->attemptRepository->findActiveAttemptForCyclePuzzle($cyclePuzzle);
        $durationMilliseconds = max(
            $cyclePuzzle->getDurationMilliseconds(),
            $this->attemptRepository->sumDurationsForCyclePuzzle($cyclePuzzle),
        );

        $cyclePuzzle
            ->setAttemptCount($completedAttemptCount)
            ->setDurationMilliseconds($durationMilliseconds)
            ->setFinallySolved($hasSolvedAttempt);

        if ($hasSolvedAttempt) {
            $cyclePuzzle->setStatus($hasFailedAttempt ? CyclePuzzleStatus::Failed : CyclePuzzleStatus::Solved);
            $cyclePuzzle->setCompletedAt(
                $cyclePuzzle->getCompletedAt()
                ?? $this->attemptRepository->findLatestCompletedAtForCyclePuzzle($cyclePuzzle)
                ?? new \DateTimeImmutable()
            );
        } elseif ($hasFailedAttempt) {
            $cyclePuzzle
                ->setStatus(CyclePuzzleStatus::Failed)
                ->setCompletedAt(null);
        } elseif ($activeAttempt instanceof Attempt) {
            $cyclePuzzle
                ->setStatus(CyclePuzzleStatus::InProgress)
                ->setCompletedAt(null);
        } else {
            $cyclePuzzle
                ->setStatus(CyclePuzzleStatus::Pending)
                ->setCompletedAt(null);
        }

        $this->cycleCompletionService->synchronizeCyclePuzzleState($cyclePuzzle);
    }

    private function isCyclePuzzleFrozen(CyclePuzzle $cyclePuzzle, ?Attempt $attempt = null): bool
    {
        if (CyclePuzzleStatus::Solved->value === $cyclePuzzle->getStatus()) {
            return true;
        }

        if (CyclePuzzleStatus::Failed->value !== $cyclePuzzle->getStatus()) {
            return false;
        }

        return $this->attemptRepository->hasSolvedAttemptForCyclePuzzle($cyclePuzzle, $attempt);
    }

    private function normalizeAttemptStatus(string $status): string
    {
        return AttemptStatus::from($status)->value;
    }
}
