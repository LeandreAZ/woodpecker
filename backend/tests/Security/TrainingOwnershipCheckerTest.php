<?php

declare(strict_types=1);

namespace App\Tests\Security;

use App\Entity\Attempt;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\TrainingSession;
use App\Entity\User;
use App\Security\TrainingOwnershipChecker;
use PHPUnit\Framework\TestCase;

final class TrainingOwnershipCheckerTest extends TestCase
{
    private TrainingOwnershipChecker $checker;
    private User $owner;
    private User $otherUser;
    private Training $training;

    protected function setUp(): void
    {
        $this->checker = new TrainingOwnershipChecker();
        $this->owner = (new User())->setEmail('owner@example.com');
        $this->setEntityId($this->owner, 1);
        $this->otherUser = (new User())->setEmail('other@example.com');
        $this->setEntityId($this->otherUser, 2);
        $this->training = (new Training())
            ->setName('Woodpecker')
            ->setOwner($this->owner);
        $this->setEntityId($this->training, 10);
    }

    public function testItAcceptsOwnedTrainingPuzzle(): void
    {
        $puzzle = (new Puzzle())->setSolution(['e2e4']);
        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($this->training)
            ->setPuzzle($puzzle)
            ->setPosition(0);

        self::assertTrue($this->checker->isOwnedByCurrentUser($trainingPuzzle, $this->owner));
    }

    public function testItRejectsResourceOwnedByAnotherUser(): void
    {
        self::assertFalse($this->checker->isOwnedByCurrentUser($this->training, $this->otherUser));
    }

    public function testItRejectsCyclePuzzleWithMismatchedTrainingRelations(): void
    {
        $otherTraining = (new Training())
            ->setName('Other')
            ->setOwner($this->owner);
        $this->setEntityId($otherTraining, 11);

        $cycle = (new Cycle())
            ->setTraining($this->training)
            ->setNumber(1)
            ->setStatus('active');
        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($otherTraining)
            ->setPuzzle((new Puzzle())->setSolution(['e2e4']))
            ->setPosition(0);
        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0);

        self::assertFalse($this->checker->isOwnedByCurrentUser($cyclePuzzle, $this->owner));
    }

    public function testItRejectsTrainingSessionWithMismatchedCycleTraining(): void
    {
        $otherTraining = (new Training())
            ->setName('Other')
            ->setOwner($this->owner);
        $this->setEntityId($otherTraining, 12);

        $cycle = (new Cycle())
            ->setTraining($this->training)
            ->setNumber(1)
            ->setStatus('active');
        $trainingSession = (new TrainingSession())
            ->setTraining($otherTraining)
            ->setCycle($cycle);

        self::assertFalse($this->checker->isOwnedByCurrentUser($trainingSession, $this->owner));
    }

    public function testItRejectsAttemptWhenSessionAndCyclePuzzlePointToDifferentTrainings(): void
    {
        $otherTraining = (new Training())
            ->setName('Other')
            ->setOwner($this->owner);
        $this->setEntityId($otherTraining, 13);

        $cycle = (new Cycle())
            ->setTraining($this->training)
            ->setNumber(1)
            ->setStatus('active');
        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($this->training)
            ->setPuzzle((new Puzzle())->setSolution(['e2e4']))
            ->setPosition(0);
        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0);
        $trainingSession = (new TrainingSession())
            ->setTraining($otherTraining)
            ->setCycle($cycle);
        $attempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzle)
            ->setTrainingSession($trainingSession);

        self::assertFalse($this->checker->isOwnedByCurrentUser($attempt, $this->owner));
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionObject($entity);
        $property = $reflection->getProperty('id');
        $property->setValue($entity, $id);
    }
}
