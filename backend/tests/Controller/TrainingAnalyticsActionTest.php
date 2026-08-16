<?php

namespace App\Tests\Controller;

use App\Controller\TrainingAnalyticsAction;
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

final class TrainingAnalyticsActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private TrainingPuzzleRepository&MockObject $trainingPuzzleRepository;
    private CycleRepository&MockObject $cycleRepository;
    private CyclePuzzleRepository&MockObject $cyclePuzzleRepository;
    private AttemptRepository&MockObject $attemptRepository;
    private TrainingAnalyticsAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->trainingPuzzleRepository = $this->createMock(TrainingPuzzleRepository::class);
        $this->cycleRepository = $this->createMock(CycleRepository::class);
        $this->cyclePuzzleRepository = $this->createMock(CyclePuzzleRepository::class);
        $this->attemptRepository = $this->createMock(AttemptRepository::class);

        $this->action = new TrainingAnalyticsAction(
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

        ($this->action)(4);
    }

    public function testBuildsAnalyticsPayloadForOwnedTraining(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Combinations')
            ->setDescription('Cycle discipline')
            ->setStatus('active')
            ->setMistakeLimit(5)
            ->setOwner($owner);
        $this->setEntityId($training, 7);

        $puzzleOne = (new Puzzle())
            ->setSolution(['e2e4', 'e7e5'])
            ->setThemes(['fork'])
            ->setRating(1600);
        $this->setEntityId($puzzleOne, 101);

        $puzzleTwo = (new Puzzle())
            ->setSolution(['g1f3', 'd7d5']);
        $this->setEntityId($puzzleTwo, 102);

        $trainingPuzzleOne = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzleOne)
            ->setPosition(0)
            ->setPersonalNote('Important');
        $this->setEntityId($trainingPuzzleOne, 201);

        $trainingPuzzleTwo = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzleTwo)
            ->setPosition(1);
        $this->setEntityId($trainingPuzzleTwo, 202);

        $cycleOne = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('completed')
            ->setStartedAt(new \DateTimeImmutable('2026-08-02T10:00:00+00:00'))
            ->setCompletedAt(new \DateTimeImmutable('2026-08-02T10:30:00+00:00'));
        $this->setEntityId($cycleOne, 301);

        $cycleTwo = (new Cycle())
            ->setTraining($training)
            ->setNumber(2)
            ->setStatus('active')
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T10:00:00+00:00'));
        $this->setEntityId($cycleTwo, 302);

        $cycleOneSolved = (new CyclePuzzle())
            ->setCycle($cycleOne)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($cycleOneSolved, 401);

        $cycleOneFailed = (new CyclePuzzle())
            ->setCycle($cycleOne)
            ->setTrainingPuzzle($trainingPuzzleTwo)
            ->setPosition(1)
            ->setStatus('failed');
        $this->setEntityId($cycleOneFailed, 402);

        $cycleTwoSolved = (new CyclePuzzle())
            ->setCycle($cycleTwo)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($cycleTwoSolved, 403);

        $cycleTwoPending = (new CyclePuzzle())
            ->setCycle($cycleTwo)
            ->setTrainingPuzzle($trainingPuzzleTwo)
            ->setPosition(1)
            ->setStatus('pending');
        $this->setEntityId($cycleTwoPending, 404);

        $session = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($cycleTwo)
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T10:00:00+00:00'));
        $this->setEntityId($session, 501);

        $successfulAttempt = (new Attempt())
            ->setCyclePuzzle($cycleTwoSolved)
            ->setTrainingSession($session)
            ->setPlayedMoves(['e2e4', 'e7e5'])
            ->setSuccessful(true)
            ->setMistakesCount(1)
            ->setDurationMilliseconds(18000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-05T10:05:00+00:00'));
        $this->setEntityId($successfulAttempt, 601);

        $failedAttempt = (new Attempt())
            ->setCyclePuzzle($cycleOneFailed)
            ->setTrainingSession($session)
            ->setPlayedMoves(['g1f3'])
            ->setSuccessful(false)
            ->setMistakesCount(3)
            ->setDurationMilliseconds(22000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-05T10:10:00+00:00'));
        $this->setEntityId($failedAttempt, 602);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository->method('findOneOwnedByUser')->with(7, $owner)->willReturn($training);
        $this->trainingPuzzleRepository->method('findByTrainingWithPuzzleOrdered')->with($training)->willReturn([$trainingPuzzleOne, $trainingPuzzleTwo]);
        $this->cycleRepository->method('findByTrainingOrdered')->with($training)->willReturn([$cycleOne, $cycleTwo]);
        $this->cyclePuzzleRepository->method('findByTrainingOrdered')->with($training)->willReturn([$cycleOneSolved, $cycleOneFailed, $cycleTwoSolved, $cycleTwoPending]);
        $this->attemptRepository->method('findByTrainingOrdered')->with($training)->willReturn([$failedAttempt, $successfulAttempt]);

        $response = ($this->action)(7);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('Combinations', $payload['training']['name']);
        self::assertSame(2, $payload['performance']['attemptCount']);
        self::assertSame(1, $payload['performance']['solvedAttemptCount']);
        self::assertSame(1, $payload['performance']['failedAttemptCount']);
        self::assertSame(50, $payload['performance']['successRate']);
        self::assertSame(20, $payload['performance']['averageDurationSeconds']);
        self::assertEquals(2.0, $payload['performance']['averageMistakes']);
        self::assertSame(2, $payload['puzzleReadiness']['puzzleCount']);
        self::assertSame(1, $payload['puzzleReadiness']['ratedPuzzleCount']);
        self::assertSame(1, $payload['puzzleReadiness']['themedPuzzleCount']);
        self::assertSame(1, $payload['puzzleReadiness']['notedPuzzleCount']);
        self::assertSame(1, $payload['progressionSnapshot']['activeCycleCount']);
        self::assertSame(1, $payload['progressionSnapshot']['completedCycleCount']);
        self::assertTrue($payload['progressionSnapshot']['resumableCycle']);
        self::assertSame(50, $payload['progressionSnapshot']['latestCycleProgressPercent']);
        self::assertSame(50, $payload['progressionSnapshot']['bestCycleProgressPercent']);
        self::assertCount(2, $payload['cycleTimeline']);
        self::assertSame(2, $payload['cycleTimeline'][0]['cycle']['number']);
        self::assertSame(1, $payload['cycleTimeline'][0]['pending']);
        self::assertSame(1, $payload['cycleTimeline'][1]['cycle']['number']);
    }


    public function testBuildsAnalyticsPayloadWithoutAttempts(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Calm set')
            ->setDescription('   ')
            ->setStatus('draft')
            ->setMistakeLimit(4)
            ->setOwner($owner);
        $this->setEntityId($training, 8);

        $puzzle = (new Puzzle())
            ->setSolution(['c2c4']);
        $this->setEntityId($puzzle, 103);

        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzle)
            ->setPosition(0)
            ->setPersonalNote('');
        $this->setEntityId($trainingPuzzle, 203);

        $completedCycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('completed')
            ->setStartedAt(new \DateTimeImmutable('2026-08-03T10:00:00+00:00'))
            ->setCompletedAt(new \DateTimeImmutable('2026-08-03T10:30:00+00:00'));
        $this->setEntityId($completedCycle, 303);

        $failedCyclePuzzle = (new CyclePuzzle())
            ->setCycle($completedCycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0)
            ->setStatus('failed');
        $this->setEntityId($failedCyclePuzzle, 405);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository->method('findOneOwnedByUser')->with(8, $owner)->willReturn($training);
        $this->trainingPuzzleRepository->method('findByTrainingWithPuzzleOrdered')->with($training)->willReturn([$trainingPuzzle]);
        $this->cycleRepository->method('findByTrainingOrdered')->with($training)->willReturn([$completedCycle]);
        $this->cyclePuzzleRepository->method('findByTrainingOrdered')->with($training)->willReturn([$failedCyclePuzzle]);
        $this->attemptRepository->method('findByTrainingOrdered')->with($training)->willReturn([]);

        $response = ($this->action)(8);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('Calm set', $payload['training']['name']);
        self::assertSame(0, $payload['performance']['attemptCount']);
        self::assertSame(0, $payload['performance']['solvedAttemptCount']);
        self::assertSame(0, $payload['performance']['failedAttemptCount']);
        self::assertSame(0, $payload['performance']['successRate']);
        self::assertSame(0, $payload['performance']['averageMistakes']);
        self::assertSame(0, $payload['performance']['averageDurationSeconds']);
        self::assertNull($payload['performance']['latestAttemptedAt']);
        self::assertSame(1, $payload['puzzleReadiness']['puzzleCount']);
        self::assertSame(0, $payload['puzzleReadiness']['ratedPuzzleCount']);
        self::assertSame(0, $payload['puzzleReadiness']['themedPuzzleCount']);
        self::assertSame(0, $payload['puzzleReadiness']['notedPuzzleCount']);
        self::assertSame(0, $payload['progressionSnapshot']['activeCycleCount']);
        self::assertSame(1, $payload['progressionSnapshot']['completedCycleCount']);
        self::assertFalse($payload['progressionSnapshot']['resumableCycle']);
        self::assertSame(0, $payload['progressionSnapshot']['latestCycleProgressPercent']);
        self::assertSame(0, $payload['progressionSnapshot']['bestCycleProgressPercent']);
        self::assertCount(1, $payload['cycleTimeline']);
        self::assertSame(1, $payload['cycleTimeline'][0]['cycle']['number']);
        self::assertSame(0, $payload['cycleTimeline'][0]['attemptCount']);
        self::assertSame(1, $payload['cycleTimeline'][0]['failed']);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}
