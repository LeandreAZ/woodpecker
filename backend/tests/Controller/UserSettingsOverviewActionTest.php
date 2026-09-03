<?php

namespace App\Tests\Controller;

use App\Controller\UserSettingsOverviewAction;
use App\Entity\AuthenticationEvent;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\User;
use App\Entity\UserPreference;
use App\Enum\AuthenticationEventType;
use App\Repository\AuthenticationEventRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use App\Service\UserPreferenceManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class UserSettingsOverviewActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private TrainingPuzzleRepository&MockObject $trainingPuzzleRepository;
    private AuthenticationEventRepository&MockObject $authenticationEventRepository;
    private UserPreferenceManager $userPreferenceManager;
    private UserSettingsOverviewAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->trainingPuzzleRepository = $this->createMock(TrainingPuzzleRepository::class);
        $this->authenticationEventRepository = $this->createMock(AuthenticationEventRepository::class);
        $this->userPreferenceManager = new UserPreferenceManager($this->createMock(EntityManagerInterface::class));

        $this->action = new UserSettingsOverviewAction(
            $this->security,
            $this->trainingRepository,
            $this->trainingPuzzleRepository,
            $this->userPreferenceManager,
            $this->authenticationEventRepository,
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
            ->setPseudonym('Leandre Ribeiro')
            ->setAvatarUrl('https://example.com/avatar.png')
            ->setRoles(['ROLE_ADMIN']);
        $this->setEntityId($user, 7);
        $this->setDateProperty($user, 'createdAt', new \DateTimeImmutable('2026-08-01T09:00:00+00:00'));

        $preference = (new UserPreference())
            ->setUser($user)
            ->setDisplayName('Leandre Ribeiro')
            ->setLanguage('en')
            ->setTheme('light')
            ->setBoardLightSquare('#F0D9B5')
            ->setBoardDarkSquare('#B58863')
            ->setShowLegalMoves(false)
            ->setShowCoordinates(true)
            ->setAnimateMoves(false)
            ->setShowRightClickTargets(true);
        $user->setPreference($preference);

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

        $loginEvent = (new AuthenticationEvent())
            ->setUser($user)
            ->setType(AuthenticationEventType::Login)
            ->setCreatedAt(new \DateTimeImmutable('2026-08-28T20:35:00+02:00'));
        $logoutEvent = (new AuthenticationEvent())
            ->setUser($user)
            ->setType(AuthenticationEventType::Logout)
            ->setCreatedAt(new \DateTimeImmutable('2026-08-28T21:05:00+02:00'))
            ->setLogoutReason('manual');

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
        $this->authenticationEventRepository
            ->method('findLatestByUserAndType')
            ->willReturnMap([
                [$user, AuthenticationEventType::Login, $loginEvent],
                [$user, AuthenticationEventType::Logout, $logoutEvent],
            ]);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('owner@example.com', $payload['user']['email']);
        self::assertSame(['ROLE_ADMIN', 'ROLE_USER'], array_values(array_unique($payload['user']['roles'])));
        self::assertSame('Leandre Ribeiro', $payload['profile']['pseudonym']);
        self::assertSame('https://example.com/avatar.png', $payload['profile']['avatarUrl']);
        self::assertSame('en', $payload['appearance']['language']);
        self::assertSame('light', $payload['appearance']['theme']);
        self::assertSame('#F0D9B5', $payload['board']['lightSquareColor']);
        self::assertSame('#B58863', $payload['board']['darkSquareColor']);
        self::assertSame('Palette personnalisée', $payload['board']['themeLabel']);
        self::assertFalse($payload['solverPreferences']['showLegalMoves']);
        self::assertTrue($payload['solverPreferences']['showCoordinates']);
        self::assertFalse($payload['solverPreferences']['animateMoves']);
        self::assertTrue($payload['solverPreferences']['showRightClickTargets']);
        self::assertSame('2026-08-28T20:35:00+02:00', $payload['security']['lastLoginAt']);
        self::assertSame('2026-08-28T21:05:00+02:00', $payload['security']['lastLogoutAt']);
        self::assertSame('manual', $payload['security']['lastLogoutReason']);
        self::assertSame(2, $payload['workspace']['trainingCount']);
        self::assertSame(1, $payload['workspace']['activeTrainingCount']);
        self::assertSame(1, $payload['workspace']['archivedTrainingCount']);
        self::assertSame(2, $payload['workspace']['puzzleCount']);
        self::assertSame('Mate en 2', $payload['workspace']['latestTrainingName']);
    }

    public function testBuildsEmptySettingsOverviewPayloadWithoutTrainings(): void
    {
        $user = (new User())
            ->setEmail('empty@example.com')
            ->setPseudonym('empty')
            ->setRoles(['ROLE_USER']);
        $this->setEntityId($user, 8);
        $this->setDateProperty($user, 'createdAt', new \DateTimeImmutable('2026-08-02T09:00:00+00:00'));

        $preference = (new UserPreference())
            ->setUser($user)
            ->setDisplayName('empty')
            ->setLanguage('fr')
            ->setTheme('dark')
            ->setBoardLightSquare(UserPreference::DEFAULT_BOARD_LIGHT)
            ->setBoardDarkSquare(UserPreference::DEFAULT_BOARD_DARK)
            ->setShowLegalMoves(true)
            ->setShowCoordinates(true)
            ->setAnimateMoves(true)
            ->setShowRightClickTargets(true);
        $user->setPreference($preference);

        $this->security->method('getUser')->willReturn($user);
        $this->trainingRepository
            ->method('findOwnedByUserOrdered')
            ->with($user)
            ->willReturn([]);
        $this->authenticationEventRepository
            ->method('findLatestByUserAndType')
            ->willReturn(null);

        $response = ($this->action)();
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('empty@example.com', $payload['user']['email']);
        self::assertSame('empty', $payload['profile']['pseudonym']);
        self::assertNull($payload['profile']['avatarUrl']);
        self::assertSame('fr', $payload['appearance']['language']);
        self::assertSame('dark', $payload['appearance']['theme']);
        self::assertSame('Vert classique', $payload['board']['themeLabel']);
        self::assertSame(0, $payload['workspace']['trainingCount']);
        self::assertSame(0, $payload['workspace']['activeTrainingCount']);
        self::assertSame(0, $payload['workspace']['archivedTrainingCount']);
        self::assertSame(0, $payload['workspace']['puzzleCount']);
        self::assertNull($payload['workspace']['latestTrainingName']);
        self::assertNull($payload['security']['lastLoginAt']);
        self::assertNull($payload['security']['lastLogoutAt']);
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
