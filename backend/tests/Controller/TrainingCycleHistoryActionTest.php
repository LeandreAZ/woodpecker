<?php

namespace App\Tests\Controller;

use App\Controller\TrainingCycleHistoryAction;
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

final class TrainingCycleHistoryActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private CycleRepository&MockObject $cycleRepository;
    private CyclePuzzleRepository&MockObject $cyclePuzzleRepository;
    private AttemptRepository&MockObject $attemptRepository;
    private TrainingCycleHistoryAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->cycleRepository = $this->createMock(CycleRepository::class);
        $this->cyclePuzzleRepository = $this->createMock(CyclePuzzleRepository::class);
        $this->attemptRepository = $this->createMock(AttemptRepository::class);

        $this->action = new TrainingCycleHistoryAction(
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

        ($this->action)(12);
    }

    public function testBuildsDetailedCycleHistoryPayloadForOwnedTraining(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Combinations')
            ->setDescription('Cycle discipline')
            ->setStatus('active')
            ->setMistakeLimit(5)
            ->setOwner($owner);
        $this->setEntityId($training, 7);

        $puzzleOne = (new Puzzle())->setSolution(['e2e4']);
        $this->setEntityId($puzzleOne, 101);
        $puzzleTwo = (new Puzzle())->setSolution(['g1f3']);
        $this->setEntityId($puzzleTwo, 102);

        $trainingPuzzleOne = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzleOne)
            ->setPosition(0)
            ->setPersonalNote('First motif');
        $this->setEntityId($trainingPuzzleOne, 201);

        $trainingPuzzleTwo = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzleTwo)
            ->setPosition(1);
        $this->setEntityId($trainingPuzzleTwo, 202);

        $completedCycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('completed')
            ->setTargetDurationSeconds(900)
            ->setStartedAt(new \DateTimeImmutable('2026-08-02T10:00:00+00:00'))
            ->setCompletedAt(new \DateTimeImmutable('2026-08-02T10:30:00+00:00'));
        $this->setEntityId($completedCycle, 301);

        $activeCycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(2)
            ->setStatus('active')
            ->setTargetDurationSeconds(1200)
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T10:00:00+00:00'));
        $this->setEntityId($activeCycle, 302);

        $completedSolvedPuzzle = (new CyclePuzzle())
            ->setCycle($completedCycle)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('solved')
            ->setCompletedAt(new \DateTimeImmutable('2026-08-02T10:05:00+00:00'));
        $this->setEntityId($completedSolvedPuzzle, 401);

        $activeSolvedPuzzle = (new CyclePuzzle())
            ->setCycle($activeCycle)
            ->setTrainingPuzzle($trainingPuzzleOne)
            ->setPosition(0)
            ->setStatus('solved')
            ->setCompletedAt(new \DateTimeImmutable('2026-08-05T10:05:00+00:00'));
        $this->setEntityId($activeSolvedPuzzle, 402);

        $activePendingPuzzle = (new CyclePuzzle())
            ->setCycle($activeCycle)
            ->setTrainingPuzzle($trainingPuzzleTwo)
            ->setPosition(1)
            ->setStatus('pending');
        $this->setEntityId($activePendingPuzzle, 403);

        $session = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($activeCycle)
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T10:00:00+00:00'));
        $this->setEntityId($session, 501);

        $latestAttempt = (new Attempt())
            ->setCyclePuzzle($activeSolvedPuzzle)
            ->setTrainingSession($session)
            ->setPlayedMoves(['e2e4'])
            ->setSuccessful(true)
            ->setMistakesCount(1)
            ->setDurationMilliseconds(18000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-05T10:10:00+00:00'));
        $this->setEntityId($latestAttempt, 601);

        $olderAttempt = (new Attempt())
            ->setCyclePuzzle($completedSolvedPuzzle)
            ->setTrainingSession($session)
            ->setPlayedMoves(['e2e4'])
            ->setSuccessful(true)
            ->setMistakesCount(0)
            ->setDurationMilliseconds(12000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-02T10:10:00+00:00'));
        $this->setEntityId($olderAttempt, 602);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOneOwnedByUser')
            ->with(7, $owner)
            ->willReturn($training);
        $this->cycleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$completedCycle, $activeCycle]);
        $this->cyclePuzzleRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$completedSolvedPuzzle, $activeSolvedPuzzle, $activePendingPuzzle]);
        $this->attemptRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$latestAttempt, $olderAttempt]);

        $response = ($this->action)(7);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('Combinations', $payload['training']['name']);
        self::assertSame(2, $payload['cycleCount']);
        self::assertSame(1, $payload['activeCycleCount']);
        self::assertSame(1, $payload['completedCycleCount']);
        self::assertCount(2, $payload['cycles']);
        self::assertSame(2, $payload['cycles'][0]['cycle']['number']);
        self::assertSame('active', $payload['cycles'][0]['cycle']['status']);
        self::assertSame(1200, $payload['cycles'][0]['cycle']['targetDurationSeconds']);
        self::assertSame(1, $payload['cycles'][0]['solved']);
        self::assertSame(1, $payload['cycles'][0]['pending']);
        self::assertSame(50, $payload['cycles'][0]['progressPercent']);
        self::assertSame(1, $payload['cycles'][0]['attemptCount']);
        self::assertSame('2026-08-05T10:10:00+00:00', $payload['cycles'][0]['latestAttemptedAt']);
        self::assertTrue($payload['cycles'][0]['hasResumableCycle']);
        self::assertCount(2, $payload['cycles'][0]['cyclePuzzles']);
        self::assertSame('First motif', $payload['cycles'][0]['cyclePuzzles'][0]['trainingPuzzle']['personalNote']);
        self::assertSame(1, $payload['cycles'][1]['cycle']['number']);
        self::assertSame('completed', $payload['cycles'][1]['cycle']['status']);
        self::assertFalse($payload['cycles'][1]['hasResumableCycle']);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}
