<?php

namespace App\Controller;

use App\Entity\Training;
use App\Entity\User;
use App\Entity\UserPreference;
use App\Enum\AuthenticationEventType;
use App\Repository\AuthenticationEventRepository;
use App\Repository\TrainingPuzzleRepository;
use App\Repository\TrainingRepository;
use App\Service\UserPreferenceManager;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class UserSettingsOverviewAction
{
    public function __construct(
        private readonly Security $security,
        private readonly TrainingRepository $trainingRepository,
        private readonly TrainingPuzzleRepository $trainingPuzzleRepository,
        private readonly UserPreferenceManager $userPreferenceManager,
        private readonly AuthenticationEventRepository $authenticationEventRepository,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        $preference = $this->userPreferenceManager->getOrCreate($user);
        $trainings = $this->trainingRepository->findOwnedByUserOrdered($user);
        $trainingCount = count($trainings);
        $activeTrainingCount = count(array_filter(
            $trainings,
            fn (Training $training): bool => 'active' === $training->getStatus(),
        ));
        $archivedTrainingCount = count(array_filter(
            $trainings,
            fn (Training $training): bool => 'archived' === $training->getStatus(),
        ));

        $puzzleCount = 0;
        foreach ($trainings as $training) {
            $puzzleCount += count($this->trainingPuzzleRepository->findByTrainingWithPuzzleOrdered($training));
        }

        $lastLogin = $this->authenticationEventRepository->findLatestByUserAndType($user, AuthenticationEventType::Login);
        $lastLogout = $this->authenticationEventRepository->findLatestByUserAndType($user, AuthenticationEventType::Logout);

        $payload = [
            'user' => [
                '@id' => $this->iri('users', $user->getId()),
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'createdAt' => $user->getCreatedAt()?->format(DATE_ATOM),
            ],
            'profile' => [
                'pseudonym' => $user->getPseudonym(),
                'avatarUrl' => $user->getAvatarUrl(),
            ],
            'appearance' => [
                'language' => $preference->getLanguage(),
                'theme' => $preference->getTheme(),
            ],
            'board' => [
                'lightSquareColor' => $preference->getBoardLightSquare(),
                'darkSquareColor' => $preference->getBoardDarkSquare(),
                'themeLabel' => $this->buildBoardThemeLabel($preference),
            ],
            'solverPreferences' => [
                'showLegalMoves' => $preference->shouldShowLegalMoves(),
                'showCoordinates' => $preference->shouldShowCoordinates(),
                'animateMoves' => $preference->shouldAnimateMoves(),
                'showRightClickTargets' => $preference->shouldShowRightClickTargets(),
            ],
            'security' => [
                'lastLoginAt' => $lastLogin?->getCreatedAt()?->format(DATE_ATOM),
                'lastLogoutAt' => $lastLogout?->getCreatedAt()?->format(DATE_ATOM),
                'lastLogoutReason' => $lastLogout?->getLogoutReason(),
            ],
            'workspace' => [
                'trainingCount' => $trainingCount,
                'activeTrainingCount' => $activeTrainingCount,
                'archivedTrainingCount' => $archivedTrainingCount,
                'puzzleCount' => $puzzleCount,
                'latestTrainingName' => ($trainings[0] ?? null)?->getName(),
            ],
        ];

        return new JsonResponse($payload, headers: ['Content-Type' => 'application/ld+json; charset=utf-8']);
    }

    private function buildBoardThemeLabel(UserPreference $preference): string
    {
        if (
            $preference->getBoardLightSquare() === UserPreference::DEFAULT_BOARD_LIGHT
            && $preference->getBoardDarkSquare() === UserPreference::DEFAULT_BOARD_DARK
        ) {
            return 'Vert classique';
        }

        return 'Palette personnalisée';
    }

    private function iri(string $resource, ?int $id): ?string
    {
        return null === $id ? null : sprintf('/api/%s/%d', $resource, $id);
    }
}
