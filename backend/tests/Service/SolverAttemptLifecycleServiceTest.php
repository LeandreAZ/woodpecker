<?php

namespace App\Tests\Service;

use App\Entity\Attempt;
use App\Entity\CyclePuzzle;
use App\Repository\AttemptRepository;
use App\Repository\CyclePuzzleRepository;
use App\Service\CycleCompletionService;
use App\Service\SolverAttemptLifecycleService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class SolverAttemptLifecycleServiceTest extends TestCase
{
    public function testNewIdentifiedAttemptDoesNotOverwritePreviousActiveAttempt(): void
    {
        $puzzle = new CyclePuzzle();
        $previous = (new Attempt())->setCyclePuzzle($puzzle)->setClientRequestId('previous')->setAttemptNumber(1)->setStatus('in_progress');
        $incoming = (new Attempt())->setCyclePuzzle($puzzle)->setClientRequestId('next')->setAttemptNumber(2)->setStatus('in_progress');
        $repository = $this->createMock(AttemptRepository::class);
        $repository->method('findOneByClientRequestId')->willReturn(null);
        $repository->method('findActiveAttemptForCyclePuzzle')->willReturn($previous);
        $manager = $this->createMock(EntityManagerInterface::class);
        $manager->expects($this->once())->method('persist')->with($incoming);
        $completion = new CycleCompletionService($this->createMock(CyclePuzzleRepository::class), $repository, $manager);
        $service = new SolverAttemptLifecycleService($repository, $manager, $completion);

        self::assertSame($incoming, $service->persistAttempt($incoming));
        self::assertSame(1, $previous->getAttemptNumber());
        self::assertSame('previous', $previous->getClientRequestId());
    }
}
