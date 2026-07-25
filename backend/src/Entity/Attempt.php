<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\AttemptRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AttemptRepository::class)]
#[ORM\Index(name: 'idx_attempt_cycle_puzzle', columns: ['cycle_puzzle_id'])]
#[ORM\Index(name: 'idx_attempt_training_session', columns: ['training_session_id'])]
#[ApiResource]
class Attempt
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'attempts')]
    #[ORM\JoinColumn(nullable: false)]
    private ?CyclePuzzle $cyclePuzzle = null;

    #[ORM\ManyToOne(inversedBy: 'attempts')]
    #[ORM\JoinColumn(nullable: false)]
    private ?TrainingSession $trainingSession = null;

    #[ORM\Column]
    private array $playedMoves = [];

    #[ORM\Column]
    private bool $successful = false;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    private int $mistakesCount = 0;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    private int $durationMilliseconds = 0;

    #[ORM\Column]
    private ?\DateTimeImmutable $attemptedAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCyclePuzzle(): ?CyclePuzzle
    {
        return $this->cyclePuzzle;
    }

    public function setCyclePuzzle(?CyclePuzzle $cyclePuzzle): self
    {
        $this->cyclePuzzle = $cyclePuzzle;

        return $this;
    }

    public function getTrainingSession(): ?TrainingSession
    {
        return $this->trainingSession;
    }

    public function setTrainingSession(?TrainingSession $trainingSession): self
    {
        $this->trainingSession = $trainingSession;

        return $this;
    }

    public function getPlayedMoves(): array
    {
        return $this->playedMoves;
    }

    public function setPlayedMoves(array $playedMoves): self
    {
        $this->playedMoves = $playedMoves;

        return $this;
    }

    public function isSuccessful(): bool
    {
        return $this->successful;
    }

    public function setSuccessful(bool $successful): self
    {
        $this->successful = $successful;

        return $this;
    }

    public function getMistakesCount(): int
    {
        return $this->mistakesCount;
    }

    public function setMistakesCount(int $mistakesCount): self
    {
        $this->mistakesCount = $mistakesCount;

        return $this;
    }

    public function getDurationMilliseconds(): int
    {
        return $this->durationMilliseconds;
    }

    public function setDurationMilliseconds(int $durationMilliseconds): self
    {
        $this->durationMilliseconds = $durationMilliseconds;

        return $this;
    }

    public function getAttemptedAt(): ?\DateTimeImmutable
    {
        return $this->attemptedAt;
    }

    public function setAttemptedAt(\DateTimeImmutable $attemptedAt): self
    {
        $this->attemptedAt = $attemptedAt;

        return $this;
    }
}
