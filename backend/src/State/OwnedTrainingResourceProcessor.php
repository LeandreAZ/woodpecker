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
use App\Enum\CyclePuzzleStatus;
use App\Repository\AttemptRepository;
use App\Repository\CycleRepository;
use App\Security\TrainingOwnershipChecker;
use App\Service\CycleCompletionService;
use App\Service\SolverAttemptLifecycleService;
use Doctrine\ORM\EntityManagerInterface;
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
        private readonly CycleRepository $cycleRepository,
        private readonly CycleCompletionService $cycleCompletionService,
        private readonly SolverAttemptLifecycleService $solverAttemptLifecycleService,
        private readonly EntityManagerInterface $entityManager,
        private readonly AttemptRepository $attemptRepository,
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

        if ($data instanceof Attempt) {
            return $this->solverAttemptLifecycleService->persistAttempt($data);
        }

        $this->preventDuplicateActiveCycle($data);
        $this->normalizeCyclePuzzleProgress($data);

        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        $this->completeCycleIfReady($data);

        return $result;
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

    private function normalizeCyclePuzzleProgress(mixed $data): void
    {
        if (!$data instanceof CyclePuzzle || null === $data->getId()) {
            return;
        }

        $originalData = $this->entityManager->getUnitOfWork()->getOriginalEntityData($data);
        if ([] === $originalData) {
            return;
        }

        $originalStatus = ($originalData['status'] ?? null) instanceof CyclePuzzleStatus
            ? $originalData['status']->value
            : (is_string($originalData['status'] ?? null) ? $originalData['status'] : $data->getStatus());
        $originalDurationMilliseconds = (int) ($originalData['durationMilliseconds'] ?? $data->getDurationMilliseconds());
        $originalCompletedAt = $originalData['completedAt'] ?? $data->getCompletedAt();
        $originalIsFrozen = 'solved' === $originalStatus
            || ('failed' === $originalStatus && $this->attemptRepository->hasSolvedAttemptForCyclePuzzle($data));

        $data->setDurationMilliseconds(max($originalDurationMilliseconds, $data->getDurationMilliseconds()));

        if ($originalIsFrozen) {
            $data->setStatus($originalStatus);
            $data->setCompletedAt($originalCompletedAt);

            return;
        }

        if ('failed' === $originalStatus && 'failed' !== $data->getStatus()) {
            $data->setStatus('failed');
        }

        if ('in_progress' === $originalStatus && 'pending' === $data->getStatus()) {
            $data->setStatus('in_progress');
        }

        if ('solved' === $data->getStatus()) {
            $data->setCompletedAt($data->getCompletedAt() ?? new \DateTimeImmutable());

            return;
        }

        if ('failed' !== $data->getStatus()) {
            $data->setCompletedAt(null);
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
