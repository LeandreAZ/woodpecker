<?php

namespace App\Tests\Controller;

use App\Controller\HistoryOverviewAction;
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
use App\Repository\TrainingRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class HistoryOverviewActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private CycleRepository&MockObject $cycleRepository;
    private CyclePuzzleRepository&MockObject $cyclePuzzleRepository;
    private AttemptRepository&MockObject $attemptRepository;
    private HistoryOverviewAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->cycleRepository = $this->createMock(CycleRepository::class);
        $this->cyclePuzzleRepository = $this->createMock(CyclePuzzleRepository::class);
        $this->attemptRepository = $this->createMock(AttemptRepository::class);

        $this->action = new HistoryOverviewAction(
            $this->security,
            $this->trainingRepository,
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

    public function testBuildsGlobalHistoryPayload(): void
    {
        $owner = (new User())->setEmail('owner@example.com');

        $trainingOne = (new Training())
            ->setName('Mate en 2')
            ->setDescription('Serie rapide')
            ->setStatus('active')
            ->setOwner($owner);
        $this->setEntityId($trainingOne, 11);

        $trainingTwo = (new Training())
            ->setName('Tactiques mixtes')
            ->setDescription('Collection longue')
            ->setStatus('draft')
            ->setOwner($owner);
        $this->setEntityId($trainingTwo, 12);

        $puzzleOne = (new Puzzle())->setSolution(['e2e4']);
        $this->setEntityId($puzzleOne, 101);
        $puzzleTwo = (new Puzzle())->setSolution(['g1f3']);
        $this->setEntityId($puzzleTwo, 102);
        $puzzleThree = (new Puzzle())->setSolution(['d2d4']);
        $this->setEntityId($puzzleThree, 103);

        $trainingPuzzleOne = (new TrainingPuzzle())->setTraining($trainingOne)->setPuzzle($puzzleOne)->setPosition(0);
        $this->setEntityId($trainingPuzzleOne, 201);
        $trainingPuzzleTwo = (new TrainingPuzzle())->setTraining($trainingOne)->setPuzzle($puzzleTwo)->setPosition(1);
        $this->setEntityId($trainingPuzzleTwo, 202);
        $trainingPuzzleThree = (new TrainingPuzzle())->setTraining($trainingTwo)->setPuzzle($puzzleThree)->setPosition(0);
        $this->setEntityId($trainingPuzzleThree, 203);

        $activeCycle = (new Cycle())
            ->setTraining($trainingOne)
            ->setNumber(3)
            ->setStatus('active')
            ->setStartedAt(new \DateTimeImmutable('2026-08-07T08:00:00+00:00'));
        $this->setEntityId($activeCycle, 301);

        $completedCycle = (new Cycle())
            ->setTraining($trainingTwo)
            ->setNumber(1)
            ->setStatus('completed')
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T08:00:00+00:00'))
            ->setCompletedAt(new \DateTimeImmutable('2026-08-05T08:20:00+00:00'));
        $this->setEntityId($completedCycle, 302);

        $activeSolvedPuzzle = (new CyclePuzzle())
            ->setCycle($activeCycle)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($activeSolvedPuzzle, 401);

        $activePendingPuzzle = (new CyclePuzzle())
            ->setCycle($activeCycle)
            ->setTrainingPuzzle($trainingPuzzleTwo)
            ->setPosition(1)
            ->setStatus('pending');
        $this->setEntityId($activePendingPuzzle, 402);

        $completedSolvedPuzzle = (new CyclePuzzle())
            ->setCycle($completedCycle)
            ->setTrainingPuzzle($trainingPuzzleThree)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($completedSolvedPuzzle, 403);

        $sessionOne = (new TrainingSession())
            ->setTraining($trainingOne)
            ->setCycle($activeCycle)
            ->setStartedAt(new \DateTimeImmutable('2026-08-07T08:00:00+00:00'));
        $this->setEntityId($sessionOne, 501);

        $sessionTwo = (new TrainingSession())
            ->setTraining($trainingTwo)
            ->setCycle($completedCycle)
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T08:00:00+00:00'));
        $this->setEntityId($sessionTwo, 502);

        $latestSuccessfulAttempt = (new Attempt())
            ->setCyclePuzzle($activeSolvedPuzzle)
            ->setTrainingSession($sessionOne)
            ->setPlayedMoves(['e2e4'])
            ->setSuccessful(true)
            ->setMistakesCount(1)
            ->setDurationMilliseconds(18000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-07T08:10:00+00:00'));
        $this->setEntityId($latestSuccessfulAttempt, 601);

        $failedAttempt = (new Attempt())
            ->setCyclePuzzle($activePendingPuzzle)
            ->setTrainingSession($sessionOne)
            ->setPlayedMoves(['g1f3'])
            ->setSuccessful(false)
            ->setMistakesCount(3)
            ->setDurationMilliseconds(22000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-07T08:05:00+00:00'));
        $this->setEntityId($failedAttempt, 602);

        $olderSuccessfulAttempt = (new Attempt())
            ->setCyclePuzzle($completedSolvedPuzzle)
            ->setTrainingSession($sessionTwo)
            ->setPlayedMoves(['d2d4'])
            ->setSuccessful(true)
            ->setMistakesCount(0)
            ->setDurationMilliseconds(12000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-05T08:15:00+00:00'));
        $this->setEntityId($olderSuccessfulAttempt, 603);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOwnedByUserOrdered')
            ->with($owner)
            ->willReturn([$trainingOne, $trainingTwo]);
        $this->cycleRepository
            ->method('findByTrainingOrdered')
            ->willReturnMap([
                [$trainingOne, [$activeCycle]],
                [$trainingTwo, [$completedCycle]],
            ]);
        $this->cyclePuzzleRepository
            ->method('findByTrainingOrdered')
            ->willReturnMap([
                [$trainingOne, [$activeSolvedPuzzle, $activePendingPuzzle]],
                [$trainingTwo, [$completedSolvedPuzzle]],
            ]);
        $this->attemptRepository
            ->method('findByTrainingOrdered')
            ->willReturnMap([
                [$trainingOne, [$latestSuccessfulAttempt, $failedAttempt]],
                [$trainingTwo, [$olderSuccessfulAttempt]],
            ]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(3, $payload['attemptCount']);
        self::assertSame(2, $payload['successfulAttemptCount']);
        self::assertSame(1, $payload['failedAttemptCount']);
        self::assertSame(2, $payload['cycleCount']);
        self::assertSame(1, $payload['activeCycleCount']);
        self::assertSame(1, $payload['completedCycleCount']);
        self::assertSame('2026-08-07T08:10:00+00:00', $payload['latestAttemptedAt']);
        self::assertCount(3, $payload['recentAttempts']);
        self::assertCount(2, $payload['recentCycles']);
        self::assertSame('Mate en 2', $payload['recentAttempts'][0]['training']['name']);
        self::assertTrue($payload['recentAttempts'][0]['successful']);
        self::assertSame(3, $payload['recentCycles'][0]['cycle']['number']);
        self::assertSame('Mate en 2', $payload['recentCycles'][0]['training']['name']);
        self::assertTrue($payload['recentCycles'][0]['hasResumableCycle']);
        self::assertSame(1, $payload['recentCycles'][0]['pending']);
        self::assertSame(1, $payload['recentCycles'][1]['attemptCount']);
    }


    public function testSortsAndLimitsRecentAttemptsAndCycles(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Volume set')
            ->setStatus('active')
            ->setOwner($owner);
        $this->setEntityId($training, 20);

        $cycles = [];
        $cyclePuzzles = [];
        $attempts = [];

        for ($index = 0; $index < 13; $index += 1) {
            $puzzle = (new Puzzle())->setSolution([sprintf('m%d', $index)]);
            $this->setEntityId($puzzle, 700 + $index);

            $trainingPuzzle = (new TrainingPuzzle())
                ->setTraining($training)
                ->setPuzzle($puzzle)
                ->setPosition($index);
            $this->setEntityId($trainingPuzzle, 800 + $index);

            $isLatestCycle = 12 === $index;
            $cycle = (new Cycle())
                ->setTraining($training)
                ->setNumber($index + 1)
                ->setStatus($isLatestCycle || 1 === $index % 2 ? 'active' : 'completed')
                ->setStartedAt(new \DateTimeImmutable(sprintf('2026-08-%02dT09:00:00+00:00', $index + 1)));

            if (!$isLatestCycle && 0 === $index % 2) {
                $cycle->setCompletedAt(new \DateTimeImmutable(sprintf('2026-08-%02dT09:15:00+00:00', $index + 1)));
            }

            $this->setEntityId($cycle, 900 + $index);
            $cycles[] = $cycle;

            $cyclePuzzle = (new CyclePuzzle())
                ->setCycle($cycle)
                ->setTrainingPuzzle($trainingPuzzle)
                ->setPosition($index)
                ->setStatus($index === 12 ? 'pending' : 'solved');
            $this->setEntityId($cyclePuzzle, 1000 + $index);
            $cyclePuzzles[] = $cyclePuzzle;

            $session = (new TrainingSession())
                ->setTraining($training)
                ->setCycle($cycle)
                ->setStartedAt(new \DateTimeImmutable(sprintf('2026-08-%02dT09:00:00+00:00', $index + 1)));
            $this->setEntityId($session, 1100 + $index);

            $attempt = (new Attempt())
                ->setCyclePuzzle($cyclePuzzle)
                ->setTrainingSession($session)
                ->setPlayedMoves([sprintf('m%d', $index)])
                ->setSuccessful(0 !== $index % 3)
                ->setMistakesCount($index % 4)
                ->setDurationMilliseconds(10000 + ($index * 1000))
                ->setAttemptedAt(new \DateTimeImmutable(sprintf('2026-08-%02dT09:10:00+00:00', $index + 1)));
            $this->setEntityId($attempt, 1200 + $index);
            $attempts[] = $attempt;
        }

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOwnedByUserOrdered')
            ->with($owner)
            ->willReturn([$training]);
        $this->cycleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn($cycles);
        $this->cyclePuzzleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn($cyclePuzzles);
        $this->attemptRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn(array_reverse($attempts));

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(13, $payload['attemptCount']);
        self::assertSame(8, $payload['successfulAttemptCount']);
        self::assertSame(5, $payload['failedAttemptCount']);
        self::assertSame(13, $payload['cycleCount']);
        self::assertSame(7, $payload['activeCycleCount']);
        self::assertSame(6, $payload['completedCycleCount']);
        self::assertCount(12, $payload['recentAttempts']);
        self::assertCount(12, $payload['recentCycles']);
        self::assertSame(13, $payload['recentAttempts'][0]['cycleNumber']);
        self::assertSame(2, $payload['recentAttempts'][11]['cycleNumber']);
        self::assertSame(13, $payload['recentCycles'][0]['cycle']['number']);
        self::assertTrue($payload['recentCycles'][0]['hasResumableCycle']);
        self::assertSame(2, $payload['recentCycles'][11]['cycle']['number']);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}

