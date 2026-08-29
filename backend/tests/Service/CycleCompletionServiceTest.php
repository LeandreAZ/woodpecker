<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Enum\CycleStatus;
use App\Repository\AttemptRepository;
use App\Repository\CyclePuzzleRepository;
use App\Service\CycleCompletionService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class CycleCompletionServiceTest extends TestCase
{
    private CyclePuzzleRepository&MockObject $cyclePuzzleRepository;
    private AttemptRepository&MockObject $attemptRepository;
    private EntityManagerInterface&MockObject $entityManager;
    private CycleCompletionService $service;

    protected function setUp(): void
    {
        $this->cyclePuzzleRepository = $this->createMock(CyclePuzzleRepository::class);
        $this->attemptRepository = $this->createMock(AttemptRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->service = new CycleCompletionService($this->cyclePuzzleRepository, $this->attemptRepository, $this->entityManager);
    }

    public function testItClearsCompletedAtForPendingPuzzleWithoutPersistedCycle(): void
    {
        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle(new Cycle())
            ->setPosition(0)
            ->setStatus('pending')
            ->setCompletedAt(new \DateTimeImmutable('-1 hour'));

        $this->attemptRepository->expects(self::once())->method('hasSolvedAttemptForCyclePuzzle')->with($cyclePuzzle)->willReturn(false);
        $this->cyclePuzzleRepository->expects(self::never())->method('hasIncompleteCyclePuzzleForCycle');
        $this->entityManager->expects(self::once())->method('flush');

        self::assertFalse($this->service->synchronizeCyclePuzzleState($cyclePuzzle));
        self::assertNull($cyclePuzzle->getCompletedAt());
    }

    public function testItDoesNotFlushWhenPendingPuzzleAlreadyHasNoCompletedAtAndCycleIsNotPersisted(): void
    {
        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle(new Cycle())
            ->setPosition(0)
            ->setStatus('pending');

        $this->attemptRepository->expects(self::once())->method('hasSolvedAttemptForCyclePuzzle')->with($cyclePuzzle)->willReturn(false);
        $this->cyclePuzzleRepository->expects(self::never())->method('hasIncompleteCyclePuzzleForCycle');
        $this->entityManager->expects(self::never())->method('flush');

        self::assertFalse($this->service->synchronizeCyclePuzzleState($cyclePuzzle));
        self::assertNull($cyclePuzzle->getCompletedAt());
    }

    public function testItCompletesCycleWhenNoPendingPuzzleRemains(): void
    {
        $cycle = (new Cycle())
            ->setNumber(1)
            ->setStatus(CycleStatus::Active)
            ->setStartedAt(new \DateTimeImmutable('-10 minutes'));
        $this->setEntityId($cycle, 10);

        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setPosition(0)
            ->setStatus('solved');

        $this->attemptRepository->expects(self::once())->method('hasSolvedAttemptForCyclePuzzle')->with($cyclePuzzle)->willReturn(true);
        $this->cyclePuzzleRepository
            ->expects(self::once())
            ->method('hasIncompleteCyclePuzzleForCycle')
            ->with(10)
            ->willReturn(false);
        $this->entityManager->expects(self::once())->method('flush');

        self::assertTrue($this->service->synchronizeCyclePuzzleState($cyclePuzzle));
        self::assertNotNull($cyclePuzzle->getCompletedAt());
        self::assertSame(CycleStatus::Completed->value, $cycle->getStatus());
        self::assertNotNull($cycle->getCompletedAt());
    }

    public function testItDoesNotCompleteCycleWhilePendingPuzzleRemains(): void
    {
        $cycle = (new Cycle())
            ->setNumber(1)
            ->setStatus(CycleStatus::Active);
        $this->setEntityId($cycle, 20);

        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setPosition(0)
            ->setStatus('failed');

        $this->attemptRepository->expects(self::once())->method('hasSolvedAttemptForCyclePuzzle')->with($cyclePuzzle)->willReturn(false);
        $this->cyclePuzzleRepository
            ->expects(self::once())
            ->method('hasIncompleteCyclePuzzleForCycle')
            ->with(20)
            ->willReturn(true);
        $this->entityManager->expects(self::never())->method('flush');

        self::assertFalse($this->service->synchronizeCyclePuzzleState($cyclePuzzle));
        self::assertNull($cyclePuzzle->getCompletedAt());
        self::assertSame(CycleStatus::Active->value, $cycle->getStatus());
        self::assertNull($cycle->getCompletedAt());
    }

    public function testItLeavesCompletedCycleStatusUntouched(): void
    {
        $completedAt = new \DateTimeImmutable('-5 minutes');
        $cycle = (new Cycle())
            ->setNumber(1)
            ->setStatus(CycleStatus::Completed)
            ->setCompletedAt($completedAt);
        $this->setEntityId($cycle, 30);

        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setPosition(0)
            ->setStatus('solved');

        $this->attemptRepository->expects(self::once())->method('hasSolvedAttemptForCyclePuzzle')->with($cyclePuzzle)->willReturn(true);
        $this->cyclePuzzleRepository->expects(self::never())->method('hasIncompleteCyclePuzzleForCycle');
        $this->entityManager->expects(self::once())->method('flush');

        self::assertFalse($this->service->synchronizeCyclePuzzleState($cyclePuzzle));
        self::assertSame(CycleStatus::Completed->value, $cycle->getStatus());
        self::assertSame($completedAt, $cycle->getCompletedAt());
        self::assertNotNull($cyclePuzzle->getCompletedAt());
    }

    public function testItKeepsExistingCycleCompletedAtWhenCycleBecomesCompleted(): void
    {
        $completedAt = new \DateTimeImmutable('-2 minutes');
        $cycle = (new Cycle())
            ->setNumber(1)
            ->setStatus(CycleStatus::Active)
            ->setCompletedAt($completedAt);
        $this->setEntityId($cycle, 40);

        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setPosition(0)
            ->setStatus('solved');

        $this->attemptRepository->expects(self::once())->method('hasSolvedAttemptForCyclePuzzle')->with($cyclePuzzle)->willReturn(true);
        $this->cyclePuzzleRepository
            ->expects(self::once())
            ->method('hasIncompleteCyclePuzzleForCycle')
            ->with(40)
            ->willReturn(false);
        $this->entityManager->expects(self::once())->method('flush');

        self::assertTrue($this->service->synchronizeCyclePuzzleState($cyclePuzzle));
        self::assertSame(CycleStatus::Completed->value, $cycle->getStatus());
        self::assertSame($completedAt, $cycle->getCompletedAt());
        self::assertNotNull($cyclePuzzle->getCompletedAt());
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionObject($entity);
        $property = $reflection->getProperty('id');
        $property->setValue($entity, $id);
    }
}
