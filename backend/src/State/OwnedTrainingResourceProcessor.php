<?php

namespace App\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Attempt;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\TrainingPuzzle;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Repository\CycleRepository;
use App\Security\TrainingOwnershipChecker;
use App\Service\CycleCompletionService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class OwnedTrainingResourceProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        #[Autowire(service: 'api_platform.doctrine.orm.state.remove_processor')]
        private readonly ProcessorInterface $removeProcessor,
        private readonly Security $security,
        private readonly TrainingOwnershipChecker $ownershipChecker,
        private readonly AttemptRepository $attemptRepository,
        private readonly CycleRepository $cycleRepository,
        private readonly CycleCompletionService $cycleCompletionService,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new AccessDeniedHttpException('You must be authenticated to manage this resource.');
        }

        if (!$this->ownershipChecker->isOwnedByCurrentUser($data, $user)) {
            throw new AccessDeniedHttpException('You cannot manage a resource linked to another user training.');
        }

        $this->preventTrainingPuzzleChangeAfterFirstCycle($data);

        if ($operation instanceof DeleteOperationInterface) {
            return $this->removeProcessor->process($data, $operation, $uriVariables, $context);
        }

        $this->preventDuplicateSuccessfulAttempt($data);
        $this->preventDuplicateActiveCycle($data);

        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        $this->completeCycleIfReady($data);

        return $result;
    }

    private function preventDuplicateSuccessfulAttempt(mixed $data): void
    {
        if (!$data instanceof Attempt || !$data->isSuccessful()) {
            return;
        }

        $cyclePuzzle = $data->getCyclePuzzle();

        if (null === $cyclePuzzle) {
            return;
        }

        if ($this->attemptRepository->hasSuccessfulAttemptForCyclePuzzle($cyclePuzzle)) {
            throw new ConflictHttpException('This cycle puzzle already has a successful attempt.');
        }
    }

    private function preventDuplicateActiveCycle(mixed $data): void
    {
        if (!$data instanceof Cycle || 'active' !== $data->getStatus()) {
            return;
        }

        $training = $data->getTraining();

        if (null === $training) {
            return;
        }

        if ($this->cycleRepository->hasActiveCycleForTraining($training, $data)) {
            throw new ConflictHttpException('This training already has an active cycle.');
        }
    }

    private function preventTrainingPuzzleChangeAfterFirstCycle(mixed $data): void
    {
        if (!$data instanceof TrainingPuzzle) {
            return;
        }

        $training = $data->getTraining();

        if (null === $training) {
            return;
        }

        if ($this->cycleRepository->hasCycleForTraining($training)) {
            throw new ConflictHttpException('This training puzzle list is locked because a cycle already exists.');
        }
    }

    private function completeCycleIfReady(mixed $data): void
    {
        if (!$data instanceof CyclePuzzle) {
            return;
        }

        $this->cycleCompletionService->synchronizeCyclePuzzleState($data);
    }
}
