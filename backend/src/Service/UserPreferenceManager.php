<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\UserPreference;
use Doctrine\ORM\EntityManagerInterface;

final class UserPreferenceManager
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function getOrCreate(User $user): UserPreference
    {
        $preference = $user->getPreference();

        if ($preference instanceof UserPreference) {
            if ('' === trim($user->getPseudonym())) {
                $user->setPseudonym($preference->getDisplayName());
            }

            return $preference;
        }

        $user->ensureDefaultPseudonym();
        $fallbackDisplayName = $user->getPseudonym();

        $preference = (new UserPreference())
            ->setUser($user)
            ->setDisplayName($fallbackDisplayName);

        $user->setPreference($preference);
        $this->entityManager->persist($preference);

        return $preference;
    }
}
