<?php

namespace App\Tests\Controller;

use App\Controller\TrainingOverviewAction;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\TrainingSession;
use App\Entity\User;
use App\Repository\CyclePuzzleRepository;
use App\Repository\CycleRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use App\Repository\TrainingSessionRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class TrainingOverviewActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private TrainingPuzzleRepository&MockObject $trainingPuzzleRepository;
    private CycleRepository&MockObject $cycleRepository;
    private CyclePuzzleRepository&MockObject $cyclePuzzleRepository;
    private TrainingSessionRepository&MockObject $trainingSessionRepository;
    private TrainingOverviewAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->trainingPuzzleRepository = $this->createMock(TrainingPuzzleRepository::class);
        $this->cycleRepository = $this->createMock(CycleRepository::class);
        $this->cyclePuzzleRepository = $this->createMock(CyclePuzzleRepository::class);
        $this->trainingSessionRepository = $this->createMock(TrainingSessionRepository::class);

        $this->action = new TrainingOverviewAction(
            $this->security,
            $this->trainingRepository,
            $this->trainingPuzzleRepository,
            $this->cycleRepository,
            $this->cyclePuzzleRepository,
            $this->trainingSessionRepository,
        );
    }

    public function testThrowsNotFoundWhenUserIsMissing(): void
    {
        $this->security->method('getUser')->willReturn(null);

        $this->expectException(NotFoundHttpException::class);

        ($this->action)(12);
    }

    public function testBuildsOverviewPayloadForOwnedTraining(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Combinations')
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
            ->setStatus('pending');
        $this->setEntityId($cyclePuzzle, 401);

        $trainingSession = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($cycle)
            ->setStartedAt(new \DateTimeImmutable('2026-08-05T10:02:00+00:00'));
        $this->setEntityId($trainingSession, 501);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOneOwnedByUser')
            ->with(7, $owner)
            ->willReturn($training);
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
        $this->trainingSessionRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$trainingSession]);

        $response = ($this->action)(7);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('/api/training_puzzles/201', $payload['trainingPuzzles'][0]['@id']);
        self::assertSame('/api/puzzles/101', $payload['trainingPuzzles'][0]['puzzle']['@id']);
        self::assertSame(['h5h7'], $payload['trainingPuzzles'][0]['puzzle']['solution']);
        self::assertSame('Important motif', $payload['trainingPuzzles'][0]['personalNote']);
        self::assertSame('/api/cycles/301', $payload['cycles'][0]['@id']);
        self::assertSame('active', $payload['cycles'][0]['status']);
        self::assertSame('/api/cycle_puzzles/401', $payload['cyclePuzzles'][0]['@id']);
        self::assertSame('/api/training_sessions/501', $payload['trainingSessions'][0]['@id']);
        self::assertSame('2026-08-05T10:02:00+00:00', $payload['trainingSessions'][0]['startedAt']);
    }


    public function testThrowsNotFoundWhenOwnedTrainingIsMissing(): void
    {
        $owner = (new User())->setEmail('owner@example.com');

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOneOwnedByUser')
            ->with(99, $owner)
            ->willReturn(null);

        $this->expectException(NotFoundHttpException::class);

        ($this->action)(99);
    }

    public function testBuildsOverviewPayloadWithNullableNestedData(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Sparse payload')
            ->setOwner($owner);
        $this->setEntityId($training, 9);

        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPosition(3)
            ->setPersonalNote(null);
        $this->setEntityId($trainingPuzzle, 202);

        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(4)
            ->setStatus('completed')
            ->setCompletedAt(new \DateTimeImmutable('2026-08-07T11:30:00+00:00'));
        $this->setEntityId($cycle, 302);

        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setPosition(3)
            ->setStatus('failed');
        $this->setEntityId($cyclePuzzle, 402);

        $trainingSession = (new TrainingSession())
            ->setTraining($training)
            ->setStartedAt(new \DateTimeImmutable('2026-08-07T11:00:00+00:00'));
        $this->setEntityId($trainingSession, 502);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository
            ->method('findOneOwnedByUser')
            ->with(9, $owner)
            ->willReturn($training);
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
        $this->trainingSessionRepository
            ->method('findByTrainingOrdered')
            ->with($training)
            ->willReturn([$trainingSession]);

        $response = ($this->action)(9);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertNull($payload['trainingPuzzles'][0]['puzzle']);
        self::assertNull($payload['trainingPuzzles'][0]['personalNote']);
        self::assertSame('2026-08-07T11:30:00+00:00', $payload['cycles'][0]['completedAt']);
        self::assertNull($payload['cyclePuzzles'][0]['trainingPuzzle']);
        self::assertNull($payload['trainingSessions'][0]['cycle']);
        self::assertSame('2026-08-07T11:00:00+00:00', $payload['trainingSessions'][0]['startedAt']);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}
