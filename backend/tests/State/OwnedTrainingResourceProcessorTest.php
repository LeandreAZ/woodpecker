<?php

declare(strict_types=1);

namespace App\Tests\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
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
use App\Security\TrainingOwnershipChecker;
use App\Service\CycleCompletionService;
use App\Service\SolverAttemptLifecycleService;
use App\State\OwnedTrainingResourceProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class OwnedTrainingResourceProcessorTest extends TestCase
{
    private ProcessorInterface&MockObject $persistProcessor;
    private ProcessorInterface&MockObject $removeProcessor;
    private Security&MockObject $security;
    private TrainingOwnershipChecker $ownershipChecker;
    private AttemptRepository&MockObject $attemptRepository;
    private CycleRepository&MockObject $cycleRepository;
    private CyclePuzzleRepository&MockObject $cyclePuzzleRepository;
    private EntityManagerInterface&MockObject $entityManager;
    private CycleCompletionService $cycleCompletionService;
    private SolverAttemptLifecycleService $solverAttemptLifecycleService;
    private OwnedTrainingResourceProcessor $processor;
    private User $user;

    protected function setUp(): void
    {
        $this->persistProcessor = $this->createMock(ProcessorInterface::class);
        $this->removeProcessor = $this->createMock(ProcessorInterface::class);
        $this->security = $this->createMock(Security::class);
        $this->ownershipChecker = new TrainingOwnershipChecker();
        $this->attemptRepository = $this->createMock(AttemptRepository::class);
        $this->cycleRepository = $this->createMock(CycleRepository::class);
        $this->cyclePuzzleRepository = $this->createMock(CyclePuzzleRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->cycleCompletionService = new CycleCompletionService($this->cyclePuzzleRepository, $this->attemptRepository, $this->entityManager);
        $this->solverAttemptLifecycleService = new SolverAttemptLifecycleService($this->attemptRepository, $this->entityManager, $this->cycleCompletionService);

        $this->processor = new OwnedTrainingResourceProcessor(
            $this->persistProcessor,
            $this->removeProcessor,
            $this->security,
            $this->ownershipChecker,
            $this->cycleRepository,
            $this->cycleCompletionService,
            $this->solverAttemptLifecycleService,
            $this->entityManager,
            $this->attemptRepository,
        );

        $this->user = (new User())->setEmail('owner@example.com');
        $this->setEntityId($this->user, 7);

        $this->security->method('getUser')->willReturn($this->user);
    }

    public function testItRejectsAnonymousUser(): void
    {
        $training = $this->createTraining();
        $anonymousSecurity = $this->createMock(Security::class);
        $anonymousSecurity->method('getUser')->willReturn(null);
        $processor = new OwnedTrainingResourceProcessor(
            $this->persistProcessor,
            $this->removeProcessor,
            $anonymousSecurity,
            $this->ownershipChecker,
            $this->cycleRepository,
            $this->cycleCompletionService,
            $this->solverAttemptLifecycleService,
            $this->entityManager,
            $this->attemptRepository,
        );
        $this->persistProcessor->expects(self::never())->method('process');

        $this->expectException(AccessDeniedHttpException::class);
        $this->expectExceptionMessage('authenticated');

        $processor->process($training, new Post());
    }

    public function testItRejectsOwnedMismatchBeforePersisting(): void
    {
        $training = $this->createTraining();
        $otherTraining = (new Training())
            ->setName('Other')
            ->setOwner($this->user);
        $this->setEntityId($otherTraining, 15);
        $cycle = (new Cycle())
            ->setTraining($training)
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

        $this->persistProcessor->expects(self::never())->method('process');

        $this->expectException(AccessDeniedHttpException::class);
        $this->expectExceptionMessage('another user training');

        $this->processor->process($cyclePuzzle, new Post());
    }

    public function testItRejectsAttemptWhenCyclePuzzleIsAlreadyFrozen(): void
    {
        $training = $this->createTraining();
        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('active');
        $this->setEntityId($cycle, 21);
        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPosition(0);
        $this->setEntityId($trainingPuzzle, 31);
        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0)
            ->setStatus('solved');
        $trainingSession = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($cycle);

        $attempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzle)
            ->setTrainingSession($trainingSession)
            ->setSuccessful(true);

        $this->entityManager->expects(self::never())->method('persist');

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('already frozen');

        $this->processor->process($attempt, new Post());
    }

    public function testItAllowsUnsuccessfulAttemptToPersistWithoutDuplicateCheck(): void
    {
        $training = $this->createTraining();
        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('active');
        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPosition(0);
        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0);
        $trainingSession = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($cycle);
        $attempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzle)
            ->setTrainingSession($trainingSession)
            ->setSuccessful(false);

        $this->persistProcessor->expects(self::never())->method('process');
        $this->attemptRepository->expects(self::exactly(2))->method('hasSolvedAttemptForCyclePuzzle')->willReturn(false);
        $this->attemptRepository->expects(self::once())->method('hasFailedAttemptForCyclePuzzle')->with($cyclePuzzle)->willReturn(true);
        $this->attemptRepository->expects(self::once())->method('findActiveAttemptForCyclePuzzle')->with($cyclePuzzle)->willReturn(null);
        $this->attemptRepository->expects(self::once())->method('sumDurationsForCyclePuzzle')->with($cyclePuzzle)->willReturn(0);
        $this->entityManager->expects(self::once())->method('persist')->with($attempt);
        $this->entityManager->expects(self::exactly(2))->method('flush');

        self::assertSame($attempt, $this->processor->process($attempt, new Post()));
        self::assertSame('failed', $cyclePuzzle->getStatus());
    }

    public function testItRejectsSecondActiveCycleForSameTraining(): void
    {
        $training = $this->createTraining();
        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(2)
            ->setStatus('active');

        $this->cycleRepository
            ->expects(self::once())
            ->method('hasActiveCycleForTraining')
            ->with($training, $cycle)
            ->willReturn(true);

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('already has an active cycle');

        $this->processor->process($cycle, new Post());
    }

    public function testItAllowsNonActiveCycleToPersistWithoutActiveCycleCheck(): void
    {
        $training = $this->createTraining();
        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(2)
            ->setStatus('planned');

        $this->cycleRepository->expects(self::never())->method('hasActiveCycleForTraining');
        $this->persistProcessor
            ->expects(self::once())
            ->method('process')
            ->with($cycle, self::isInstanceOf(Post::class), [], [])
            ->willReturn($cycle);

        self::assertSame($cycle, $this->processor->process($cycle, new Post()));
    }

    public function testItRejectsActiveCycleWithoutOwnedTraining(): void
    {
        $cycle = (new Cycle())
            ->setNumber(2)
            ->setStatus('active');

        $this->cycleRepository->expects(self::never())->method('hasActiveCycleForTraining');
        $this->persistProcessor->expects(self::never())->method('process');

        $this->expectException(AccessDeniedHttpException::class);
        $this->expectExceptionMessage('another user training');

        $this->processor->process($cycle, new Post());
    }

    public function testItLocksTrainingPuzzleListAfterFirstCycle(): void
    {
        $training = $this->createTraining();
        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPosition(0);

        $this->cycleRepository
            ->expects(self::once())
            ->method('hasCycleForTraining')
            ->with($training)
            ->willReturn(true);

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('puzzle list is locked');

        $this->processor->process($trainingPuzzle, new Post());
    }

    public function testItRejectsTrainingPuzzleWithoutOwnedTraining(): void
    {
        $trainingPuzzle = (new TrainingPuzzle())
            ->setPosition(0);

        $this->cycleRepository->expects(self::never())->method('hasCycleForTraining');
        $this->persistProcessor->expects(self::never())->method('process');

        $this->expectException(AccessDeniedHttpException::class);
        $this->expectExceptionMessage('another user training');

        $this->processor->process($trainingPuzzle, new Post());
    }

    public function testItPersistsCyclePuzzleThenSynchronizesCompletion(): void
    {
        $training = $this->createTraining();
        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('active');
        $this->setEntityId($cycle, 22);
        $trainingPuzzle = (new TrainingPuzzle())
            ->setTraining($training)
            ->setPosition(0);
        $this->setEntityId($trainingPuzzle, 32);
        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0)
            ->setStatus('solved');

        $this->persistProcessor
            ->expects(self::once())
            ->method('process')
            ->with($cyclePuzzle, self::isInstanceOf(Post::class), [], [])
            ->willReturn($cyclePuzzle);
        $this->attemptRepository->expects(self::once())->method('hasSolvedAttemptForCyclePuzzle')->with($cyclePuzzle)->willReturn(true);
        $this->cyclePuzzleRepository
            ->expects(self::once())
            ->method('hasIncompleteCyclePuzzleForCycle')
            ->with(22)
            ->willReturn(false);
        $this->entityManager->expects(self::once())->method('flush');

        self::assertSame($cyclePuzzle, $this->processor->process($cyclePuzzle, new Post()));
        self::assertSame('completed', $cycle->getStatus());
        self::assertNotNull($cycle->getCompletedAt());
        self::assertNotNull($cyclePuzzle->getCompletedAt());
    }

    public function testItUsesRemoveProcessorForDeleteOperation(): void
    {
        $training = $this->createTraining();

        $this->removeProcessor
            ->expects(self::once())
            ->method('process')
            ->with($training, self::isInstanceOf(Delete::class), [], [])
            ->willReturn($training);
        $this->persistProcessor->expects(self::never())->method('process');

        self::assertSame($training, $this->processor->process($training, new Delete()));
    }

    private function createTraining(): Training
    {
        $training = (new Training())
            ->setName('Woodpecker set')
            ->setOwner($this->user);
        $this->setEntityId($training, 11);

        return $training;
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionObject($entity);
        $property = $reflection->getProperty('id');
        $property->setValue($entity, $id);
    }
}
