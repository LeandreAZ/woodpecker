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
            return $preference;
        }

        $fallbackDisplayName = strstr((string) $user->getEmail(), '@', true) ?: (string) $user->getEmail();

        $preference = (new UserPreference())
            ->setUser($user)
            ->setDisplayName($fallbackDisplayName);

        $user->setPreference($preference);
        $this->entityManager->persist($preference);

        return $preference;
    }
}
