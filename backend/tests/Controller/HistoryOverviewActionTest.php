<?php

namespace App\Tests\Controller;

use App\Controller\HistoryOverviewAction;
use App\Entity\Attempt;
use App\Entity\AuthenticationEvent;
use App\Entity\Cycle;
use App\Entity\CyclePuzzle;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\TrainingSession;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Repository\AuthenticationEventRepository;
use App\Repository\TrainingRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class HistoryOverviewActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private AttemptRepository&MockObject $attemptRepository;
    private AuthenticationEventRepository&MockObject $authenticationEventRepository;
    private HistoryOverviewAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->attemptRepository = $this->createMock(AttemptRepository::class);
        $this->authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);

        $this->action = new HistoryOverviewAction(
            $this->security,
            $this->trainingRepository,
            $this->attemptRepository,
            $this->authenticationEventRepository,
        );
    }

    public function testThrowsNotFoundWhenUserIsMissing(): void
    {
        $this->security->method('getUser')->willReturn(null);

        $this->expectException(NotFoundHttpException::class);

        ($this->action)();
    }

    public function testBuildsOneHistoryItemPerCompletedAttemptWithoutRescuedStatus(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())
            ->setName('Mat')
            ->setDescription('Serie rapide')
            ->setStatus('active')
            ->setOwner($owner);
        $this->setEntityId($training, 11);

        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(2)
            ->setStatus('completed')
            ->setStartedAt(new \DateTimeImmutable('2026-08-28T11:00:00+00:00'))
            ->setCompletedAt(new \DateTimeImmutable('2026-08-28T11:45:00+00:00'));
        $this->setEntityId($cycle, 301);

        $puzzle = (new Puzzle())->setSolution(['e2e4']);
        $this->setEntityId($puzzle, 101);
        $trainingPuzzle = (new TrainingPuzzle())->setTraining($training)->setPuzzle($puzzle)->setPosition(0);
        $this->setEntityId($trainingPuzzle, 201);
        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0)
            ->setStatus('failed');
        $this->setEntityId($cyclePuzzle, 401);

        $session = (new TrainingSession())
            ->setTraining($training)
            ->setCycle($cycle)
            ->setStartedAt(new \DateTimeImmutable('2026-08-28T11:00:00+00:00'));
        $this->setEntityId($session, 501);

        $firstAttempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzle)
            ->setTrainingSession($session)
            ->setAttemptNumber(1)
            ->setStatus('failed')
            ->setPlayedMoves(['a2a4'])
            ->setMistakesCount(1)
            ->setDurationMilliseconds(117000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-28T11:33:56+00:00'));
        $this->setEntityId($firstAttempt, 601);

        $secondAttempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzle)
            ->setTrainingSession($session)
            ->setAttemptNumber(2)
            ->setStatus('solved')
            ->setPlayedMoves(['a2a4', 'e2e4'])
            ->setMistakesCount(0)
            ->setDurationMilliseconds(19000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-28T11:35:56+00:00'));
        $this->setEntityId($secondAttempt, 602);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository->method('findOwnedByUserOrdered')->with($owner)->willReturn([$training]);
        $this->attemptRepository->method('findByTrainingOrdered')->with($training)->willReturn([$secondAttempt, $firstAttempt]);
        $this->authenticationEventRepository->method('findByUserOrdered')->with($owner)->willReturn([]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(2, $payload['totalItems']);
        self::assertSame('2026-08-28T11:35:56+00:00', $payload['latestOccurredAt']);
        self::assertSame('Puzzle #1', $payload['items'][0]['label']);
        self::assertSame(2, $payload['items'][0]['attemptNumber']);
        self::assertSame('solved', $payload['items'][0]['status']);
        self::assertSame('Réussi', $payload['items'][0]['statusLabel']);
        self::assertSame(19000, $payload['items'][0]['durationMilliseconds']);
        self::assertSame(1, $payload['items'][1]['attemptNumber']);
        self::assertSame('failed', $payload['items'][1]['status']);
        self::assertSame(117000, $payload['items'][1]['durationMilliseconds']);
    }

    public function testIncludesAuthenticationEventsInTimeline(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())->setName('Mat')->setStatus('active')->setOwner($owner);
        $this->setEntityId($training, 11);

        $attempt = (new Attempt())
            ->setAttemptNumber(1)
            ->setStatus('failed')
            ->setDurationMilliseconds(8000)
            ->setAttemptedAt(new \DateTimeImmutable('2026-08-28T11:33:56+00:00'));
        $this->setEntityId($attempt, 601);

        $loginEvent = (new AuthenticationEvent())
            ->setUser($owner)
            ->setType('login')
            ->setCreatedAt(new \DateTimeImmutable('2026-08-28T11:40:00+00:00'))
            ->setPlatform('Windows')
            ->setBrowser('Chrome')
            ->setDevice('Desktop');
        $this->setEntityId($loginEvent, 701);

        $logoutEvent = (new AuthenticationEvent())
            ->setUser($owner)
            ->setType('logout')
            ->setCreatedAt(new \DateTimeImmutable('2026-08-28T11:20:00+00:00'));
        $this->setEntityId($logoutEvent, 702);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository->method('findOwnedByUserOrdered')->with($owner)->willReturn([$training]);
        $this->attemptRepository->method('findByTrainingOrdered')->with($training)->willReturn([$attempt]);
        $this->authenticationEventRepository->method('findByUserOrdered')->with($owner)->willReturn([$loginEvent, $logoutEvent]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertTrue($payload['supportsConnectionHistory']);
        self::assertSame('connection', $payload['items'][0]['activityType']);
        self::assertSame('Connexion', $payload['items'][0]['label']);
        self::assertSame('Windows · Chrome · Desktop', $payload['items'][0]['detail']);
        self::assertNull($payload['items'][0]['status']);
        self::assertSame('attempt', $payload['items'][1]['activityType']);
        self::assertSame('disconnection', $payload['items'][2]['activityType']);
    }

    public function testIgnoresInProgressAttempts(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $training = (new Training())->setName('Blitz')->setStatus('active')->setOwner($owner);
        $this->setEntityId($training, 21);

        $cycle = (new Cycle())
            ->setTraining($training)
            ->setNumber(1)
            ->setStatus('active')
            ->setStartedAt(new \DateTimeImmutable('2026-08-25T11:00:00+00:00'));
        $this->setEntityId($cycle, 321);

        $puzzle = (new Puzzle())->setSolution(['e2e4']);
        $this->setEntityId($puzzle, 121);
        $trainingPuzzle = (new TrainingPuzzle())->setTraining($training)->setPuzzle($puzzle)->setPosition(0);
        $this->setEntityId($trainingPuzzle, 221);
        $cyclePuzzle = (new CyclePuzzle())
            ->setCycle($cycle)
            ->setTrainingPuzzle($trainingPuzzle)
            ->setPosition(0)
            ->setStatus('in_progress');
        $this->setEntityId($cyclePuzzle, 421);
        $session = (new TrainingSession())->setTraining($training)->setCycle($cycle)->setStartedAt(new \DateTimeImmutable('2026-08-25T11:00:00+00:00'));
        $this->setEntityId($session, 521);

        $inProgressAttempt = (new Attempt())
            ->setCyclePuzzle($cyclePuzzle)
            ->setTrainingSession($session)
            ->setAttemptNumber(1)
            ->setStatus('in_progress')
            ->setPlayedMoves([])
            ->setMistakesCount(0)
            ->setDurationMilliseconds(12000)
            ->setStartedAt(new \DateTimeImmutable('2026-08-25T11:00:12+00:00'));
        $this->setEntityId($inProgressAttempt, 621);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository->method('findOwnedByUserOrdered')->with($owner)->willReturn([$training]);
        $this->attemptRepository->method('findByTrainingOrdered')->with($training)->willReturn([$inProgressAttempt]);
        $this->authenticationEventRepository->method('findByUserOrdered')->with($owner)->willReturn([]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(0, $payload['totalItems']);
        self::assertSame([], $payload['items']);
        self::assertNull($payload['latestOccurredAt']);
    }

    /**
     * @param object $entity
     */
    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionObject($entity);
        $property = $reflection->getProperty('id');
        $property->setValue($entity, $id);
    }
}
