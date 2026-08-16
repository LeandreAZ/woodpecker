<?php

namespace App\Tests\Controller;

use App\Controller\StatsOverviewAction;
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

final class StatsOverviewActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private TrainingPuzzleRepository&MockObject $trainingPuzzleRepository;
    private CycleRepository&MockObject $cycleRepository;
    private CyclePuzzleRepository&MockObject $cyclePuzzleRepository;
    private AttemptRepository&MockObject $attemptRepository;
    private StatsOverviewAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->trainingPuzzleRepository = $this->createMock(TrainingPuzzleRepository::class);
        $this->cycleRepository = $this->createMock(CycleRepository::class);
        $this->cyclePuzzleRepository = $this->createMock(CyclePuzzleRepository::class);
        $this->attemptRepository = $this->createMock(AttemptRepository::class);

        $this->action = new StatsOverviewAction(
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

    public function testBuildsStatsOverviewPayload(): void
    {
        $owner = (new User())->setEmail('owner@example.com');

        $trainingOne = (new Training())
            ->setName('Mate in 2')
            ->setDescription('Short tactical set')
            ->setOwner($owner);
        $this->setEntityId($trainingOne, 4);

        $trainingTwo = (new Training())
            ->setName('Endgame tactics')
            ->setOwner($owner);
        $this->setEntityId($trainingTwo, 5);

        $puzzleOne = (new Puzzle())->setSolution(['e2e4']);
        $this->setEntityId($puzzleOne, 11);
        $puzzleTwo = (new Puzzle())->setSolution(['d2d4']);
        $this->setEntityId($puzzleTwo, 12);

        $trainingPuzzleOne = (new TrainingPuzzle())
            ->setTraining($trainingOne)
            ->setPuzzle($puzzleOne)
            ->setPosition(0);
        $this->setEntityId($trainingPuzzleOne, 21);

        $trainingPuzzleTwo = (new TrainingPuzzle())
            ->setTraining($trainingTwo)
            ->setPuzzle($puzzleTwo)
            ->setPosition(0);
        $this->setEntityId($trainingPuzzleTwo, 22);

        $cycleOne = (new Cycle())
            ->setTraining($trainingOne)
            ->setNumber(1)
            ->setStatus('active');
        $this->setEntityId($cycleOne, 31);

        $cycleTwo = (new Cycle())
            ->setTraining($trainingTwo)
            ->setNumber(2)
            ->setStatus('completed');
        $this->setEntityId($cycleTwo, 32);

        $cyclePuzzleOne = (new CyclePuzzle())
            ->setCycle($cycleOne)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('pending');
        $this->setEntityId($cyclePuzzleOne, 41);

        $cyclePuzzleTwo = (new CyclePuzzle())
            ->setCycle($cycleTwo)
            ->setTrainingPuzzle($trainingPuzzleTwo)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($cyclePuzzleTwo, 42);

        $sessionOne = (new TrainingSession())
            ->setTraining($trainingOne)
            ->setCycle($cycleOne)
            ->setStartedAt(new \DateTimeImmutable('2026-08-06T18:00:00+00:00'));
        $this->setEntityId($sessionOne, 51);

        $sessionTwo = (new TrainingSession())
            ->setTraining($trainingTwo)
            ->setCycle($cycleTwo)
            ->setStartedAt(new \DateTimeImmutable('2026-08-07T18:00:00+00:00'));
        $this->setEntityId($sessionTwo, 52);

        $attemptOne = (new Attempt())
            ->setCyclePuzzle($cyclePuzzleOne)
            ->setTrainingSession($sessionOne)
            ->setPlayedMoves(['e2e4'])
            ->setSuccessful(false)
            ->setMistakesCount(2)
            ->setDurationMilliseconds(9000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-06T18:10:00+00:00'));
        $this->setEntityId($attemptOne, 61);

        $attemptTwo = (new Attempt())
            ->setCyclePuzzle($cyclePuzzleTwo)
            ->setTrainingSession($sessionTwo)
            ->setPlayedMoves(['d2d4'])
            ->setSuccessful(true)
            ->setMistakesCount(1)
            ->setDurationMilliseconds(8000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-07T18:10:00+00:00'));
        $this->setEntityId($attemptTwo, 62);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOwnedByUserOrdered')
            ->with($owner)
            ->willReturn([$trainingOne, $trainingTwo]);
        $this->trainingPuzzleRepository
            ->method('findByTrainingWithPuzzleOrdered')
            ->willReturnMap([
                [$trainingOne, [$trainingPuzzleOne]],
                [$trainingTwo, [$trainingPuzzleTwo]],
            ]);
        $this->cycleRepository
            ->method('findByTrainingOrdered')
            ->willReturnMap([
                [$trainingOne, [$cycleOne]],
                [$trainingTwo, [$cycleTwo]],
            ]);
        $this->cyclePuzzleRepository
            ->method('findByTrainingOrdered')
            ->willReturnMap([
                [$trainingOne, [$cyclePuzzleOne]],
                [$trainingTwo, [$cyclePuzzleTwo]],
            ]);
        $this->attemptRepository
            ->method('findByTrainingOrdered')
            ->willReturnMap([
                [$trainingOne, [$attemptOne]],
                [$trainingTwo, [$attemptTwo]],
            ]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(2, $payload['trainingCount']);
        self::assertSame(2, $payload['puzzleCount']);
        self::assertSame(2, $payload['attemptCount']);
        self::assertSame(1, $payload['successfulAttemptCount']);
        self::assertSame(50, $payload['successRate']);
        self::assertEquals(1.5, $payload['averageMistakes']);
        self::assertSame(1, $payload['activeCycleCount']);
        self::assertSame(1, $payload['completedCycleCount']);
        self::assertSame(1, $payload['resumableTrainingCount']);
        self::assertSame(1, $payload['solvedCyclePuzzleCount']);
        self::assertSame(0, $payload['failedCyclePuzzleCount']);
        self::assertSame(1, $payload['pendingCyclePuzzleCount']);
        self::assertSame('2026-08-07T18:10:00+00:00', $payload['latestAttemptedAt']);
        self::assertCount(2, $payload['trainingBreakdown']);
        self::assertSame('Mate in 2', $payload['trainingBreakdown'][0]['training']['name']);
    }


    public function testBuildsStatsOverviewPayloadWithoutAttemptsOrDescriptions(): void
    {
        $owner = (new User())->setEmail('owner@example.com');

        $training = (new Training())
            ->setName('Quiet set')
            ->setDescription('   ')
            ->setOwner($owner);
        $this->setEntityId($training, 6);

        $puzzle = (new Puzzle())->setSolution(['c2c4']);
        $this->setEntityId($puzzle, 13);

        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzle)
            ->setPosition(0);
        $this->setEntityId($trainingPuzzle, 23);

        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('completed');
        $this->setEntityId($cycle, 33);

        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0)
            ->setStatus('failed');
        $this->setEntityId($cyclePuzzle, 43);

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
            ->willReturn([]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(1, $payload['trainingCount']);
        self::assertSame(1, $payload['puzzleCount']);
        self::assertSame(0, $payload['attemptCount']);
        self::assertSame(0, $payload['successfulAttemptCount']);
        self::assertSame(0, $payload['successRate']);
        self::assertSame(0, $payload['averageMistakes']);
        self::assertSame(0, $payload['activeCycleCount']);
        self::assertSame(1, $payload['completedCycleCount']);
        self::assertSame(0, $payload['resumableTrainingCount']);
        self::assertSame(0, $payload['solvedCyclePuzzleCount']);
        self::assertSame(1, $payload['failedCyclePuzzleCount']);
        self::assertSame(0, $payload['pendingCyclePuzzleCount']);
        self::assertNull($payload['latestAttemptedAt']);
        self::assertFalse($payload['trainingBreakdown'][0]['descriptionReady']);
        self::assertSame(0, $payload['trainingBreakdown'][0]['attemptCount']);
        self::assertSame('completed', $payload['trainingBreakdown'][0]['latestCycleStatus']);
        self::assertFalse($payload['trainingBreakdown'][0]['hasResumableCycle']);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}

