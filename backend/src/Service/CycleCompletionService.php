<?php

namespace App\Service;

use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Enum\CycleStatus;
use App\Repository\CyclePuzzleRepository;
use Doctrine\ORM\EntityManagerInterface;

final class CycleCompletionService
{
    public function __construct(
        private readonly CyclePuzzleRepository $cyclePuzzleRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function synchronizeCyclePuzzleState(CyclePuzzle $cyclePuzzle): bool
    {
        $hasChanges = false;
        $status = $cyclePuzzle->getStatus();

        if ('pending' === $status && null !== $cyclePuzzle->getCompletedAt()) {
            $cyclePuzzle->setCompletedAt(null);
            $hasChanges = true;
        }

        if ('pending' !== $status && null === $cyclePuzzle->getCompletedAt()) {
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

        if ($this->cyclePuzzleRepository->hasPendingCyclePuzzleForCycle($cycle->getId())) {
            if ($hasChanges) {
                $this->entityManager->flush();
            }

            return false;
        }

        $cycle
            ->setStatus(CycleStatus::Completed)
            ->setCompletedAt($cycle->getCompletedAt() ?? new \DateTimeImmutable());

        $hasChanges = true;
        $this->entityManager->flush();

        return true;
    }
}
