<?php

namespace App\State;

use ApiPlatform\Metadata\DeleteOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Attempt;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Security\TrainingOwnershipChecker;
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

        if ($operation instanceof DeleteOperationInterface) {
            return $this->removeProcessor->process($data, $operation, $uriVariables, $context);
        }

        $this->preventDuplicateSuccessfulAttempt($data);

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
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
}
