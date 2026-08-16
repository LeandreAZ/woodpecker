<?php

namespace App\Tests\Controller;

use App\Controller\TrainingDashboardAction;
use App\Entity\Attempt;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\TrainingSession;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Repository\CyclePuzzleRepository;
use App\Repository\CycleRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class TrainingDashboardActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private TrainingPuzzleRepository&MockObject $trainingPuzzleRepository;
    private CycleRepository&MockObject $cycleRepository;
    private CyclePuzzleRepository&MockObject $cyclePuzzleRepository;
    private AttemptRepository&MockObject $attemptRepository;
    private TrainingDashboardAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->trainingPuzzleRepository = $this->createMock(TrainingPuzzleRepository::class);
        $this->cycleRepository = $this->createMock(CycleRepository::class);
        $this->cyclePuzzleRepository = $this->createMock(CyclePuzzleRepository::class);
        $this->attemptRepository = $this->createMock(AttemptRepository::class);

        $this->action = new TrainingDashboardAction(
            $this->security,
            $this->trainingRepository,
            $this->trainingPuzzleRepository,
            $this->cycleRepository,
            $this->cyclePuzzleRepository,
            $this->attemptRepository,
        );
    }

    public function testThrowsNotFoundWhenUserIsMissing(): void
    {
        $this->security->method('getUser')->willReturn(null);

        $this->expectException(NotFoundHttpException::class);

        ($this->action)();
    }

    public function testReturnsDashboardCards(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Mate in 2')
            ->setDescription('Short tactical set')
            ->setOwner($owner);
        $this->setEntityId($training, 4);

        $puzzle = (new Puzzle())
            ->setSolution(['e2e4', 'e7e5']);
        $this->setEntityId($puzzle, 11);

        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzle)
            ->setPosition(0);
        $this->setEntityId($trainingPuzzle, 21);

        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('active');
        $this->setEntityId($cycle, 31);

        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($cyclePuzzle, 41);

        $session = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($cycle)
            ->setStartedAt(new \DateTimeImmutable('2026-08-06T18:00:00+00:00'));
        $this->setEntityId($session, 51);

        $attempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzle)
            ->setTrainingSession($session)
            ->setPlayedMoves(['e2e4'])
            ->setSuccessful(true)
            ->setMistakesCount(0)
            ->setDurationMilliseconds(12000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-06T18:10:00+00:00'));
        $this->setEntityId($attempt, 61);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOwnedByUserOrdered')
            ->with($owner)
            ->willReturn([$training]);
        $this->trainingPuzzleRepository
            ->method('findByTrainingWithPuzzleOrdered')
            ->with($training)
            ->willReturn([$trainingPuzzle]);
        $this->cycleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$cycle]);
        $this->cyclePuzzleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$cyclePuzzle]);
        $this->attemptRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$attempt]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertCount(1, $payload);
        self::assertSame('/api/trainings/4', $payload[0]['training']['@id']);
        self::assertSame('Mate in 2', $payload[0]['training']['name']);
        self::assertSame(1, $payload[0]['puzzleCount']);
        self::assertSame(1, $payload[0]['attemptCount']);
        self::assertSame(100, $payload[0]['progressPercent']);
        self::assertSame(1, $payload[0]['solvedCount']);
        self::assertSame(0, $payload[0]['failedCount']);
        self::assertSame(0, $payload[0]['pendingCount']);
        self::assertSame(1, $payload[0]['latestCycleNumber']);
        self::assertSame('active', $payload[0]['latestCycleStatus']);
        self::assertFalse($payload[0]['hasResumableCycle']);
        self::assertTrue($payload[0]['descriptionReady']);
        self::assertSame('2026-08-06T18:10:00+00:00', $payload[0]['latestAttemptedAt']);
    }


    public function testMarksActiveCycleAsResumableWhenPendingPuzzlesRemain(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Longer set')
            ->setOwner($owner);
        $this->setEntityId($training, 8);

        $puzzleOne = (new Puzzle())
            ->setSolution(['e2e4']);
        $this->setEntityId($puzzleOne, 12);

        $puzzleTwo = (new Puzzle())
            ->setSolution(['d2d4']);
        $this->setEntityId($puzzleTwo, 13);

        $trainingPuzzleOne = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzleOne)
            ->setPosition(0);
        $this->setEntityId($trainingPuzzleOne, 22);

        $trainingPuzzleTwo = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzleTwo)
            ->setPosition(1);
        $this->setEntityId($trainingPuzzleTwo, 23);

        $latestCycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(3)
            ->setStatus('active');
        $this->setEntityId($latestCycle, 32);

        $solvedCyclePuzzle = (new CyclePuzzle())
            ->setCycle($latestCycle)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($solvedCyclePuzzle, 42);

        $pendingCyclePuzzle = (new CyclePuzzle())
            ->setCycle($latestCycle)
            ->setTrainingPuzzle($trainingPuzzleTwo)
            ->setPosition(1)
            ->setStatus('pending');
        $this->setEntityId($pendingCyclePuzzle, 43);

        $session = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($latestCycle)
            ->setStartedAt(new \DateTimeImmutable('2026-08-06T19:00:00+00:00'));
        $this->setEntityId($session, 52);

        $attempt = (new Attempt())
            ->setCyclePuzzle($solvedCyclePuzzle)
            ->setTrainingSession($session)
            ->setPlayedMoves(['e2e4'])
            ->setSuccessful(true)
            ->setMistakesCount(1)
            ->setDurationMilliseconds(14000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-06T19:05:00+00:00'));
        $this->setEntityId($attempt, 62);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOwnedByUserOrdered')
            ->with($owner)
            ->willReturn([$training]);
        $this->trainingPuzzleRepository
            ->method('findByTrainingWithPuzzleOrdered')
            ->with($training)
            ->willReturn([$trainingPuzzleOne, $trainingPuzzleTwo]);
        $this->cycleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$latestCycle]);
        $this->cyclePuzzleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$solvedCyclePuzzle, $pendingCyclePuzzle]);
        $this->attemptRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$attempt]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertCount(1, $payload);
        self::assertSame(50, $payload[0]['progressPercent']);
        self::assertSame(1, $payload[0]['solvedCount']);
        self::assertSame(0, $payload[0]['failedCount']);
        self::assertSame(1, $payload[0]['pendingCount']);
        self::assertTrue($payload[0]['hasResumableCycle']);
        self::assertFalse($payload[0]['descriptionReady']);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}
