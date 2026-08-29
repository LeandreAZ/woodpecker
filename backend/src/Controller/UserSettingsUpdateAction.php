<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\UserPreferenceManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

final class UserSettingsUpdateAction
{
    private const ALLOWED_LANGUAGES = ['fr', 'en', 'es', 'pt', 'de', 'ru', 'zh', 'ja', 'ko'];
    private const ALLOWED_THEMES = ['dark', 'light'];

    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPreferenceManager $userPreferenceManager,
        private readonly UserSettingsOverviewAction $userSettingsOverviewAction,
    ) {
    }

    #[Route('/api/users/me/settings', name: 'api_user_settings_update', methods: ['PUT'])]
    public function __invoke(Request $request): JsonResponse
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new NotFoundHttpException();
        }

        $payload = json_decode($request->getContent() ?: '{}', true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Le payload JSON est invalide.');
        }

        $preference = $this->userPreferenceManager->getOrCreate($user);
        $profile = is_array($payload['profile'] ?? null) ? $payload['profile'] : [];
        $appearance = is_array($payload['appearance'] ?? null) ? $payload['appearance'] : [];
        $board = is_array($payload['board'] ?? null) ? $payload['board'] : [];
        $solverPreferences = is_array($payload['solverPreferences'] ?? null) ? $payload['solverPreferences'] : [];

        if (array_key_exists('pseudonym', $profile) || array_key_exists('displayName', $profile)) {
            $pseudonym = trim((string) ($profile['pseudonym'] ?? $profile['displayName'] ?? ''));
            if ('' === $pseudonym || mb_strlen($pseudonym) > 80) {
                throw new BadRequestHttpException('Le pseudonyme doit contenir entre 1 et 80 caractères.');
            }

            $user->setPseudonym($pseudonym);
            $preference->setDisplayName($pseudonym);
        }

        if (array_key_exists('avatarUrl', $profile)) {
            $user->setAvatarUrl($this->validateAvatarUrl($profile['avatarUrl']));
        }

        if (array_key_exists('language', $appearance)) {
            $language = strtolower(trim((string) $appearance['language']));
            if (!in_array($language, self::ALLOWED_LANGUAGES, true)) {
                throw new BadRequestHttpException('La langue demandée n\'est pas prise en charge.');
            }

            $preference->setLanguage($language);
        }

        if (array_key_exists('theme', $appearance)) {
            $theme = strtolower(trim((string) $appearance['theme']));
            if (!in_array($theme, self::ALLOWED_THEMES, true)) {
                throw new BadRequestHttpException('Le thème doit être dark ou light.');
            }

            $preference->setTheme($theme);
        }

        if (array_key_exists('lightSquareColor', $board)) {
            $preference->setBoardLightSquare($this->validateHexColor($board['lightSquareColor'], 'La couleur des cases claires est invalide.'));
        }

        if (array_key_exists('darkSquareColor', $board)) {
            $preference->setBoardDarkSquare($this->validateHexColor($board['darkSquareColor'], 'La couleur des cases foncées est invalide.'));
        }

        if (array_key_exists('showLegalMoves', $solverPreferences)) {
            $preference->setShowLegalMoves((bool) $solverPreferences['showLegalMoves']);
        }

        if (array_key_exists('showCoordinates', $solverPreferences)) {
            $preference->setShowCoordinates((bool) $solverPreferences['showCoordinates']);
        }

        if (array_key_exists('animateMoves', $solverPreferences)) {
            $preference->setAnimateMoves((bool) $solverPreferences['animateMoves']);
        }

        if (array_key_exists('showRightClickTargets', $solverPreferences)) {
            $preference->setShowRightClickTargets((bool) $solverPreferences['showRightClickTargets']);
        }

        $user->ensureDefaultPseudonym();
        $user->setPreference($preference);
        $this->entityManager->persist($user);
        $this->entityManager->persist($preference);
        $this->entityManager->flush();

        return ($this->userSettingsOverviewAction)();
    }

    private function validateHexColor(mixed $value, string $message): string
    {
        $normalized = strtoupper(trim((string) $value));

        if (!preg_match('/^#[0-9A-F]{6}$/', $normalized)) {
            throw new BadRequestHttpException($message);
        }

        return $normalized;
    }

    private function validateAvatarUrl(mixed $value): ?string
    {
        if (null === $value) {
            return null;
        }

        $normalized = trim((string) $value);
        if ('' === $normalized) {
            return null;
        }

        if (!filter_var($normalized, FILTER_VALIDATE_URL)) {
            throw new BadRequestHttpException('L\'avatar doit être une URL valide.');
        }

        return $normalized;
    }
}
