<?php

namespace App\Tests\Controller;

use App\Controller\TrainingSummaryAction;
use App\ReadModel\TrainingSummaryReader;
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

final class TrainingSummaryActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private TrainingPuzzleRepository&MockObject $trainingPuzzleRepository;
    private CycleRepository&MockObject $cycleRepository;
    private CyclePuzzleRepository&MockObject $cyclePuzzleRepository;
    private AttemptRepository&MockObject $attemptRepository;
    private TrainingSummaryAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->trainingPuzzleRepository = $this->createMock(TrainingPuzzleRepository::class);
        $this->cycleRepository = $this->createMock(CycleRepository::class);
        $this->cyclePuzzleRepository = $this->createMock(CyclePuzzleRepository::class);
        $this->attemptRepository = $this->createMock(AttemptRepository::class);

        $this->action = new TrainingSummaryAction(
            $this->security,
            $this->trainingRepository,
            new TrainingSummaryReader(
                $this->trainingPuzzleRepository,
                $this->cycleRepository,
                $this->cyclePuzzleRepository,
                $this->attemptRepository,
            ),
        );
    }

    public function testThrowsNotFoundWhenUserIsMissing(): void
    {
        $this->security->method('getUser')->willReturn(null);
        $this->trainingRepository->expects(self::never())->method('findOneOwnedByUser');

        $this->expectException(NotFoundHttpException::class);

        ($this->action)(12);
    }

    public function testBuildsSummaryPayloadForOwnedTraining(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Combinations')
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

        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(2)
            ->setStatus('active')
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T10:00:00+00:00'));
        $this->setEntityId($cycle, 301);

        $cyclePuzzleSolved = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($cyclePuzzleSolved, 401);

        $cyclePuzzleFailed = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzleTwo)
            ->setPosition(1)
            ->setStatus('failed');
        $this->setEntityId($cyclePuzzleFailed, 402);

        $session = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($cycle)
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T10:00:00+00:00'));
        $this->setEntityId($session, 501);

        $successfulAttempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzleSolved)
            ->setTrainingSession($session)
            ->setPlayedMoves(['e2e4', 'e7e5'])
            ->setSuccessful(true)
            ->setMistakesCount(1)
            ->setDurationMilliseconds(18000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-05T10:05:00+00:00'));
        $this->setEntityId($successfulAttempt, 601);

        $failedAttempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzleFailed)
            ->setTrainingSession($session)
            ->setPlayedMoves(['g1f3'])
            ->setSuccessful(false)
            ->setMistakesCount(3)
            ->setDurationMilliseconds(22000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-05T10:10:00+00:00'));
        $this->setEntityId($failedAttempt, 602);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOneOwnedByUser')
            ->with(7, $owner)
            ->willReturn($training);
        $this->trainingPuzzleRepository
            ->method('findByTrainingWithPuzzleOrdered')
            ->with($training)
            ->willReturn([$trainingPuzzleOne, $trainingPuzzleTwo]);
        $this->cycleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$cycle]);
        $this->cyclePuzzleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$cyclePuzzleSolved, $cyclePuzzleFailed]);
        $this->attemptRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$failedAttempt, $successfulAttempt]);

        $response = ($this->action)(7);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(2, $payload['puzzleCount']);
        self::assertSame(1, $payload['ratedPuzzleCount']);
        self::assertSame(1, $payload['themedPuzzleCount']);
        self::assertSame(1, $payload['notedPuzzleCount']);
        self::assertSame(2, $payload['attemptCount']);
        self::assertSame(1, $payload['solvedAttemptCount']);
        self::assertEquals(2.0, $payload['averageMistakes']);
        self::assertSame(2, $payload['latestCycleSummary']['cycle']['number']);
        self::assertSame(1, $payload['latestCycleSummary']['solved']);
        self::assertSame(1, $payload['latestCycleSummary']['failed']);
        self::assertSame(100, $payload['latestCycleSummary']['progressPercent']);
        self::assertSame(2, $payload['latestCycleSummary']['attemptCount']);
        self::assertCount(2, $payload['latestAttempts']);
        self::assertSame(2, $payload['latestAttempts'][0]['cycleNumber']);
        self::assertSame(1, $payload['latestAttempts'][0]['trainingPuzzlePosition']);
    }


    public function testUsesLatestCycleFirstAndKeepsZeroedSummaryWhenNoAttemptsExist(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Structured set')
            ->setOwner($owner);
        $this->setEntityId($training, 8);

        $puzzleOne = (new Puzzle())
            ->setSolution(['e2e4'])
            ->setThemes(['fork']);
        $this->setEntityId($puzzleOne, 103);

        $puzzleTwo = (new Puzzle())
            ->setSolution(['d2d4']);
        $this->setEntityId($puzzleTwo, 104);

        $trainingPuzzleOne = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzleOne)
            ->setPosition(0);
        $this->setEntityId($trainingPuzzleOne, 203);

        $trainingPuzzleTwo = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzleTwo)
            ->setPosition(1)
            ->setPersonalNote('  ');
        $this->setEntityId($trainingPuzzleTwo, 204);

        $olderCycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('completed')
            ->setStartedAt(new \DateTimeImmutable('2026-08-04T09:00:00+00:00'))
            ->setCompletedAt(new \DateTimeImmutable('2026-08-04T09:20:00+00:00'));
        $this->setEntityId($olderCycle, 302);

        $latestCycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(3)
            ->setStatus('active')
            ->setStartedAt(new \DateTimeImmutable('2026-08-06T09:00:00+00:00'));
        $this->setEntityId($latestCycle, 303);

        $olderSolvedPuzzle = (new CyclePuzzle())
            ->setCycle($olderCycle)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($olderSolvedPuzzle, 403);

        $latestPendingPuzzle = (new CyclePuzzle())
            ->setCycle($latestCycle)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('pending');
        $this->setEntityId($latestPendingPuzzle, 404);

        $latestFailedPuzzle = (new CyclePuzzle())
            ->setCycle($latestCycle)
            ->setTrainingPuzzle($trainingPuzzleTwo)
            ->setPosition(1)
            ->setStatus('failed');
        $this->setEntityId($latestFailedPuzzle, 405);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOneOwnedByUser')
            ->with(8, $owner)
            ->willReturn($training);
        $this->trainingPuzzleRepository
            ->method('findByTrainingWithPuzzleOrdered')
            ->with($training)
            ->willReturn([$trainingPuzzleOne, $trainingPuzzleTwo]);
        $this->cycleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$olderCycle, $latestCycle]);
        $this->cyclePuzzleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$olderSolvedPuzzle, $latestPendingPuzzle, $latestFailedPuzzle]);
        $this->attemptRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([]);

        $response = ($this->action)(8);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(0, $payload['attemptCount']);
        self::assertSame(0, $payload['solvedAttemptCount']);
        self::assertSame(0, $payload['averageMistakes']);
        self::assertSame(3, $payload['latestCycleSummary']['cycle']['number']);
        self::assertSame(0, $payload['latestCycleSummary']['solved']);
        self::assertSame(1, $payload['latestCycleSummary']['failed']);
        self::assertSame(1, $payload['latestCycleSummary']['pending']);
        self::assertSame(0, $payload['latestCycleSummary']['attemptCount']);
        self::assertSame(50, $payload['latestCycleSummary']['progressPercent']);
        self::assertCount(2, $payload['cycleSummaries']);
        self::assertSame(3, $payload['cycleSummaries'][0]['cycle']['number']);
        self::assertSame(1, $payload['cycleSummaries'][1]['cycle']['number']);
        self::assertSame([], $payload['latestAttempts']);
        self::assertSame(0, $payload['notedPuzzleCount']);
        self::assertSame(1, $payload['themedPuzzleCount']);
    }

    public function testReportsRescuedPuzzlesAndRealAttemptDistribution(): void
    {
        $training = new Training();
        $cycle = (new Cycle())->setNumber(1);
        $this->setEntityId($cycle, 1);
        $puzzles = [];
        $attempts = [];
        foreach ([1, 2, 3, 4, null] as $index => $solvedOn) {
            $puzzle = (new CyclePuzzle())->setCycle($cycle)->setStatus(1 === $solvedOn ? 'solved' : 'failed');
            $this->setEntityId($puzzle, $index + 1);
            $puzzles[] = $puzzle;
            for ($number = 1; $number <= ($solvedOn ?? 1); ++$number) {
                $attempts[] = (new Attempt())->setCyclePuzzle($puzzle)->setAttemptNumber($number)->setStatus($number === $solvedOn ? 'solved' : 'failed');
            }
        }
        $this->trainingPuzzleRepository->method('findByTrainingWithPuzzleOrdered')->willReturn([]);
        $this->cycleRepository->method('findByTrainingOrdered')->willReturn([$cycle]);
        $this->cyclePuzzleRepository->method('findByTrainingOrdered')->willReturn($puzzles);
        $this->attemptRepository->method('findByTrainingOrdered')->willReturn($attempts);
        $reader = new TrainingSummaryReader($this->trainingPuzzleRepository, $this->cycleRepository, $this->cyclePuzzleRepository, $this->attemptRepository);
        $payload = $reader->build($training);
        self::assertSame(3, $payload['latestCycleSummary']['rescuedCount']);
        self::assertSame(1, $payload['latestCycleSummary']['unresolvedCount']);
        self::assertSame(['oneAttemptCount' => 1, 'twoAttemptCount' => 1, 'threeAttemptCount' => 1, 'fourPlusAttemptCount' => 1, 'resolvedPuzzleCount' => 4], $payload['attemptCountDistribution']);
    }

    public function testDoesNotReadDetailsForTrainingNotOwnedByUser(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository->expects(self::once())->method('findOneOwnedByUser')->with(999, $owner)->willReturn(null);
        $this->trainingPuzzleRepository->expects(self::never())->method('findByTrainingWithPuzzleOrdered');
        $this->cycleRepository->expects(self::never())->method('findByTrainingOrdered');
        $this->cyclePuzzleRepository->expects(self::never())->method('findByTrainingOrdered');
        $this->attemptRepository->expects(self::never())->method('findByTrainingOrdered');

        $this->expectException(NotFoundHttpException::class);
        ($this->action)(999);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}
