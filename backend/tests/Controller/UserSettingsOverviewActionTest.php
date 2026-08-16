<?php

namespace App\Tests\Controller;

use App\Controller\UserSettingsOverviewAction;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\User;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class UserSettingsOverviewActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private TrainingPuzzleRepository&MockObject $trainingPuzzleRepository;
    private UserSettingsOverviewAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->trainingPuzzleRepository = $this->createMock(TrainingPuzzleRepository::class);

        $this->action = new UserSettingsOverviewAction(
            $this->security,
            $this->trainingRepository,
            $this->trainingPuzzleRepository,
        );
    }

    public function testThrowsNotFoundWhenUserIsMissing(): void
    {
        $this->security->method('getUser')->willReturn(null);

        $this->expectException(NotFoundHttpException::class);

        ($this->action)();
    }

    public function testBuildsSettingsOverviewPayload(): void
    {
        $user = (new User())
            ->setEmail('owner@example.com')
            ->setRoles(['ROLE_ADMIN']);
        $this->setEntityId($user, 7);
        $this->setDateProperty($user, 'createdAt', new \DateTimeImmutable('2026-08-01T09:00:00+00:00'));

        $trainingOne = (new Training())
            ->setName('Mate en 2')
            ->setStatus('active')
            ->setMistakeLimit(5)
            ->setOwner($user);
        $this->setEntityId($trainingOne, 101);

        $trainingTwo = (new Training())
            ->setName('Tactiques mixtes')
            ->setStatus('archived')
            ->setMistakeLimit(3)
            ->setOwner($user);
        $this->setEntityId($trainingTwo, 102);

        $puzzleOne = (new Puzzle())->setSolution(['e2e4']);
        $this->setEntityId($puzzleOne, 201);
        $puzzleTwo = (new Puzzle())->setSolution(['g1f3']);
        $this->setEntityId($puzzleTwo, 202);

        $trainingPuzzleOne = (new TrainingPuzzle())->setTraining($trainingOne)->setPuzzle($puzzleOne)->setPosition(0);
        $this->setEntityId($trainingPuzzleOne, 301);
        $trainingPuzzleTwo = (new TrainingPuzzle())->setTraining($trainingOne)->setPuzzle($puzzleTwo)->setPosition(1);
        $this->setEntityId($trainingPuzzleTwo, 302);

        $this->security->method('getUser')->willReturn($user);
        $this->trainingRepository
            ->method('findOwnedByUserOrdered')
            ->with($user)
            ->willReturn([$trainingOne, $trainingTwo]);
        $this->trainingPuzzleRepository
            ->method('findByTrainingWithPuzzleOrdered')
            ->willReturnMap([
                [$trainingOne, [$trainingPuzzleOne, $trainingPuzzleTwo]],
                [$trainingTwo, []],
            ]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('owner@example.com', $payload['user']['email']);
        self::assertSame(['ROLE_ADMIN', 'ROLE_USER'], array_values(array_unique($payload['user']['roles'])));
        self::assertSame(2, $payload['workspace']['trainingCount']);
        self::assertSame(1, $payload['workspace']['activeTrainingCount']);
        self::assertSame(1, $payload['workspace']['archivedTrainingCount']);
        self::assertSame(2, $payload['workspace']['puzzleCount']);
        self::assertSame('Mate en 2', $payload['workspace']['latestTrainingName']);
        self::assertSame(4, $payload['preferencesPreview']['defaultMistakeLimit']);
        self::assertTrue($payload['preferencesPreview']['lockTrainingAfterCycle']);
        self::assertTrue($payload['preferencesPreview']['trackedSolverByDefault']);
        self::assertFalse($payload['integrations']['lichessConnected']);
        self::assertFalse($payload['integrations']['chessComConnected']);
        self::assertTrue($payload['integrations']['exportReady']);
    }


    public function testBuildsEmptySettingsOverviewPayloadWithoutTrainings(): void
    {
        $user = (new User())
            ->setEmail('empty@example.com')
            ->setRoles(['ROLE_USER']);
        $this->setEntityId($user, 8);
        $this->setDateProperty($user, 'createdAt', new \DateTimeImmutable('2026-08-02T09:00:00+00:00'));

        $this->security->method('getUser')->willReturn($user);
        $this->trainingRepository
            ->method('findOwnedByUserOrdered')
            ->with($user)
            ->willReturn([]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('empty@example.com', $payload['user']['email']);
        self::assertSame(0, $payload['workspace']['trainingCount']);
        self::assertSame(0, $payload['workspace']['activeTrainingCount']);
        self::assertSame(0, $payload['workspace']['archivedTrainingCount']);
        self::assertSame(0, $payload['workspace']['puzzleCount']);
        self::assertNull($payload['workspace']['latestTrainingName']);
        self::assertSame(3, $payload['preferencesPreview']['defaultMistakeLimit']);
        self::assertFalse($payload['integrations']['exportReady']);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }

    private function setDateProperty(object $entity, string $property, \DateTimeImmutable $value): void
    {
        $reflection = new \ReflectionProperty($entity, $property);
        $reflection->setValue($entity, $value);
    }
}

