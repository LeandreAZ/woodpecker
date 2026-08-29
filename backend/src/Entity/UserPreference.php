<?php

namespace App\Entity;

use App\Repository\UserPreferenceRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserPreferenceRepository::class)]
#[ORM\Table(name: 'user_preference')]
#[ORM\HasLifecycleCallbacks]
class UserPreference
{
    public const DEFAULT_LANGUAGE = 'fr';
    public const DEFAULT_THEME = 'dark';
    public const DEFAULT_BOARD_LIGHT = '#EEEED2';
    public const DEFAULT_BOARD_DARK = '#769656';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'preference', targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(length: 80)]
    private string $displayName = '';

    #[ORM\Column(length: 8)]
    private string $language = self::DEFAULT_LANGUAGE;

    #[ORM\Column(length: 20)]
    private string $theme = self::DEFAULT_THEME;

    #[ORM\Column(length: 7)]
    private string $boardLightSquare = self::DEFAULT_BOARD_LIGHT;

    #[ORM\Column(length: 7)]
    private string $boardDarkSquare = self::DEFAULT_BOARD_DARK;

    #[ORM\Column]
    private bool $showLegalMoves = true;

    #[ORM\Column]
    private bool $showCoordinates = true;

    #[ORM\Column]
    private bool $animateMoves = true;

    #[ORM\Column]
    private bool $showRightClickTargets = true;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getDisplayName(): string
    {
        return $this->displayName;
    }

    public function setDisplayName(string $displayName): self
    {
        $this->displayName = trim($displayName);

        return $this;
    }

    public function getLanguage(): string
    {
        return $this->language;
    }

    public function setLanguage(string $language): self
    {
        $this->language = strtolower(trim($language));

        return $this;
    }

    public function getTheme(): string
    {
        return $this->theme;
    }

    public function setTheme(string $theme): self
    {
        $this->theme = strtolower(trim($theme));

        return $this;
    }

    public function getBoardLightSquare(): string
    {
        return $this->boardLightSquare;
    }

    public function setBoardLightSquare(string $boardLightSquare): self
    {
        $this->boardLightSquare = strtoupper(trim($boardLightSquare));

        return $this;
    }

    public function getBoardDarkSquare(): string
    {
        return $this->boardDarkSquare;
    }

    public function setBoardDarkSquare(string $boardDarkSquare): self
    {
        $this->boardDarkSquare = strtoupper(trim($boardDarkSquare));

        return $this;
    }

    public function shouldShowLegalMoves(): bool
    {
        return $this->showLegalMoves;
    }

    public function setShowLegalMoves(bool $showLegalMoves): self
    {
        $this->showLegalMoves = $showLegalMoves;

        return $this;
    }

    public function shouldShowCoordinates(): bool
    {
        return $this->showCoordinates;
    }

    public function setShowCoordinates(bool $showCoordinates): self
    {
        $this->showCoordinates = $showCoordinates;

        return $this;
    }

    public function shouldAnimateMoves(): bool
    {
        return $this->animateMoves;
    }

    public function setAnimateMoves(bool $animateMoves): self
    {
        $this->animateMoves = $animateMoves;

        return $this;
    }

    public function shouldShowRightClickTargets(): bool
    {
        return $this->showRightClickTargets;
    }

    public function setShowRightClickTargets(bool $showRightClickTargets): self
    {
        $this->showRightClickTargets = $showRightClickTargets;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    #[ORM\PrePersist]
    public function initializeTimestamps(): void
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function refreshUpdatedAt(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
