<?php

namespace App\Service;

use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Enum\CycleStatus;
use App\Repository\AttemptRepository;
use App\Repository\CyclePuzzleRepository;
use Doctrine\ORM\EntityManagerInterface;

final class CycleCompletionService
{
    public function __construct(
        private readonly CyclePuzzleRepository $cyclePuzzleRepository,
        private readonly AttemptRepository $attemptRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function synchronizeCyclePuzzleState(CyclePuzzle $cyclePuzzle): bool
    {
        $hasChanges = false;
        $status = $cyclePuzzle->getStatus();
        $hasSolvedAttempt = $this->attemptRepository->hasSolvedAttemptForCyclePuzzle($cyclePuzzle);
        $isTerminal = 'solved' === $status || ('failed' === $status && $hasSolvedAttempt);

        if (!$isTerminal && null !== $cyclePuzzle->getCompletedAt()) {
            $cyclePuzzle->setCompletedAt(null);
            $hasChanges = true;
        }

        if ($isTerminal && null === $cyclePuzzle->getCompletedAt()) {
            $cyclePuzzle->setCompletedAt(new \DateTimeImmutable());
            $hasChanges = true;
        }

        $cycle = $cyclePuzzle->getCycle();

        if (!$cycle instanceof Cycle || null === $cycle->getId()) {
            if ($hasChanges) {
                $this->entityManager->flush();
            }

            return false;
        }

        if (CycleStatus::Completed->value === $cycle->getStatus()) {
            if ($hasChanges) {
                $this->entityManager->flush();
            }

            return false;
        }

        if ($this->cyclePuzzleRepository->hasIncompleteCyclePuzzleForCycle($cycle->getId())) {
            if ($hasChanges) {
                $this->entityManager->flush();
            }

            return false;
        }

        $cycle
            ->setStatus(CycleStatus::Completed)
            ->setCompletedAt($cycle->getCompletedAt() ?? new \DateTimeImmutable());

        $this->entityManager->flush();

        return true;
    }
}
