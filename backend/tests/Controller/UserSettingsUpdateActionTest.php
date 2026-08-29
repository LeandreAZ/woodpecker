<?php

namespace App\Tests\Controller;

use App\Controller\UserSettingsOverviewAction;
use App\Controller\UserSettingsUpdateAction;
use App\Entity\User;
use App\Entity\UserPreference;
use App\Repository\AuthenticationEventRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use App\Service\UserPreferenceManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class UserSettingsUpdateActionTest extends TestCase
{
    private Security&MockObject $security;
    private EntityManagerInterface&MockObject $entityManager;
    private UserPreferenceManager $userPreferenceManager;
    private UserSettingsOverviewAction $overviewAction;
    private UserSettingsUpdateAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->userPreferenceManager = new UserPreferenceManager($this->entityManager);
        $this->overviewAction = new UserSettingsOverviewAction(
            $this->security,
            $this->createMock(TrainingRepository::class),
            $this->createMock(TrainingPuzzleRepository::class),
            $this->userPreferenceManager,
            $this->createMock(AuthenticationEventRepository::class),
        );

        $this->action = new UserSettingsUpdateAction(
            $this->security,
            $this->entityManager,
            $this->userPreferenceManager,
            $this->overviewAction,
        );
    }

    public function testPersistsValidatedSettings(): void
    {
        $user = (new User())->setEmail('owner@example.com');
        $preference = (new UserPreference())
            ->setUser($user)
            ->setDisplayName('Owner')
            ->setLanguage('fr')
            ->setTheme('dark')
            ->setBoardLightSquare('#EEEED2')
            ->setBoardDarkSquare('#769656')
            ->setShowLegalMoves(true)
            ->setShowCoordinates(true)
            ->setAnimateMoves(true)
            ->setShowRightClickTargets(true);
        $user->setPreference($preference);

        $request = Request::create('/api/users/me/settings', 'PUT', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'profile' => ['displayName' => 'Leandre Ribeiro'],
            'appearance' => ['language' => 'en', 'theme' => 'light'],
            'board' => ['lightSquareColor' => '#F0D9B5', 'darkSquareColor' => '#B58863'],
            'solverPreferences' => [
                'showLegalMoves' => false,
                'showCoordinates' => true,
                'animateMoves' => false,
                'showRightClickTargets' => false,
            ],
        ], JSON_THROW_ON_ERROR));

        $this->security->method('getUser')->willReturn($user);
        $this->entityManager->expects(self::once())->method('persist')->with($preference);
        $this->entityManager->expects(self::once())->method('flush');

        $response = $this->action->__invoke($request);
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('Leandre Ribeiro', $preference->getDisplayName());
        self::assertSame('en', $preference->getLanguage());
        self::assertSame('light', $preference->getTheme());
        self::assertSame('#F0D9B5', $preference->getBoardLightSquare());
        self::assertSame('#B58863', $preference->getBoardDarkSquare());
        self::assertFalse($preference->shouldShowLegalMoves());
        self::assertTrue($preference->shouldShowCoordinates());
        self::assertFalse($preference->shouldAnimateMoves());
        self::assertFalse($preference->shouldShowRightClickTargets());
        self::assertSame('Leandre Ribeiro', $payload['profile']['displayName']);
    }

    public function testRejectsInvalidTheme(): void
    {
        $user = (new User())->setEmail('owner@example.com');
        $preference = (new UserPreference())
            ->setUser($user)
            ->setDisplayName('Owner');
        $user->setPreference($preference);

        $request = Request::create('/api/users/me/settings', 'PUT', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode([
            'appearance' => ['theme' => 'system'],
        ], JSON_THROW_ON_ERROR));

        $this->security->method('getUser')->willReturn($user);
        $this->entityManager->expects(self::never())->method('flush');

        $this->expectException(BadRequestHttpException::class);

        $this->action->__invoke($request);
    }
}
