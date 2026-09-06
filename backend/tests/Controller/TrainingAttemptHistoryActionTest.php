<?php

namespace App\Tests\Controller;

use App\Controller\TrainingAttemptHistoryAction;
use App\ReadModel\TrainingAttemptHistoryReader;
use App\Entity\Attempt;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\TrainingSession;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Repository\TrainingRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class TrainingAttemptHistoryActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private AttemptRepository&MockObject $attemptRepository;
    private TrainingAttemptHistoryAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->attemptRepository = $this->createMock(AttemptRepository::class);

        $this->action = new TrainingAttemptHistoryAction(
            $this->security,
            new TrainingAttemptHistoryReader($this->attemptRepository),
            $this->trainingRepository,
        );
    }

    public function testThrowsNotFoundWhenUserIsMissing(): void
    {
        $this->security->method('getUser')->willReturn(null);

        $this->expectException(NotFoundHttpException::class);

        ($this->action)(12);
    }

    public function testBuildsDetailedAttemptHistoryPayloadForOwnedTraining(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Combinations')
            ->setDescription('Cycle discipline')
            ->setStatus('active')
            ->setMistakeLimit(5)
            ->setOwner($owner);
        $this->setEntityId($training, 7);

        $puzzle = (new Puzzle())
            ->setFen('6k1/5ppp/8/7Q/8/3B4/6PP/6K1 w - - 0 1')
            ->setSolution(['h5h7'])
            ->setThemes(['mate'])
            ->setRating(1800);
        $this->setEntityId($puzzle, 101);

        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPuzzle($puzzle)
            ->setPosition(0)
            ->setPersonalNote('Important motif');
        $this->setEntityId($trainingPuzzle, 201);

        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(2)
            ->setStatus('active')
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T10:00:00+00:00'));
        $this->setEntityId($cycle, 301);

        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0)
            ->setStatus('solved');
        $this->setEntityId($cyclePuzzle, 401);

        $trainingSession = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($cycle)
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T10:00:00+00:00'));
        $this->setEntityId($trainingSession, 501);

        $latestAttempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzle)
            ->setTrainingSession($trainingSession)
            ->setPlayedMoves(['h5h7'])
            ->setSuccessful(true)
            ->setMistakesCount(1)
            ->setDurationMilliseconds(18000)
            ->setCompletedAt(new \DateTimeImmutable('2026-08-05T10:10:00+00:00'));
        $this->setEntityId($latestAttempt, 601);

        $olderAttempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzle)
            ->setTrainingSession($trainingSession)
            ->setPlayedMoves(['h5h7'])
            ->setSuccessful(false)
            ->setMistakesCount(3)
            ->setDurationMilliseconds(22000)
            ->setCompletedAt(new \DateTimeImmutable('2026-08-05T10:05:00+00:00'));
        $this->setEntityId($olderAttempt, 602);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOneOwnedByUser')
            ->with(7, $owner)
            ->willReturn($training);
        $this->attemptRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$latestAttempt, $olderAttempt]);

        $response = ($this->action)(7);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('Combinations', $payload['training']['name']);
        self::assertSame(2, $payload['attemptCount']);
        self::assertSame(1, $payload['successfulAttemptCount']);
        self::assertSame(1, $payload['failedAttemptCount']);
        self::assertSame('2026-08-05T10:10:00+00:00', $payload['latestAttemptedAt']);
        self::assertCount(2, $payload['attempts']);
        self::assertSame('/api/attempts/601', $payload['attempts'][0]['@id']);
        self::assertTrue($payload['attempts'][0]['successful']);
        self::assertSame(['h5h7'], $payload['attempts'][0]['playedMoves']);
        self::assertSame(2, $payload['attempts'][0]['cycle']['number']);
        self::assertSame('solved', $payload['attempts'][0]['cyclePuzzle']['status']);
        self::assertSame(0, $payload['attempts'][0]['trainingPuzzle']['position']);
        self::assertSame('Important motif', $payload['attempts'][0]['trainingPuzzle']['personalNote']);
        self::assertSame('/api/puzzles/101', $payload['attempts'][0]['puzzle']['@id']);
        self::assertSame(['mate'], $payload['attempts'][0]['puzzle']['themes']);
        self::assertSame(1800, $payload['attempts'][0]['puzzle']['rating']);
        self::assertFalse($payload['attempts'][1]['successful']);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}
