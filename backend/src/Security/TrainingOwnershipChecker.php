<?php

namespace App\Security;

use App\Entity\Attempt;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\TrainingSession;
use App\Entity\User;

final class TrainingOwnershipChecker
{
    public function isOwnedByCurrentUser(mixed $data, User $user): bool
    {
        $training = $this->getTraining($data);

        if (null === $training) {
            return false;
        }

        if ($training->getOwner() !== $user) {
            return false;
        }

        return $this->hasConsistentTrainingRelations($data);
    }

    private function getTraining(mixed $data): ?Training
    {
        return match (true) {
            $data instanceof Training => $data,
            $data instanceof TrainingPuzzle => $data->getTraining(),
            $data instanceof Cycle => $data->getTraining(),
            $data instanceof CyclePuzzle => $data->getCycle()?->getTraining(),
            $data instanceof TrainingSession => $data->getTraining(),
            $data instanceof Attempt => $data->getTrainingSession()?->getTraining(),
            default => null,
        };
    }

    private function hasConsistentTrainingRelations(mixed $data): bool
    {
        if ($data instanceof CyclePuzzle) {
            return $data->getCycle()?->getTraining() === $data->getTrainingPuzzle()?->getTraining();
        }

        if ($data instanceof TrainingSession && null !== $data->getCycle()) {
            return $data->getTraining() === $data->getCycle()->getTraining();
        }

        if ($data instanceof Attempt) {
            return $data->getTrainingSession()?->getTraining() === $data->getCyclePuzzle()?->getCycle()?->getTraining();
        }

        return true;
    }
}
