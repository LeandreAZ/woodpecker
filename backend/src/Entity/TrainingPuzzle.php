<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\TrainingPuzzleRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TrainingPuzzleRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\UniqueConstraint(name: 'uniq_training_puzzle_training_puzzle', columns: ['training_id', 'puzzle_id'])]
#[ORM\UniqueConstraint(name: 'uniq_training_puzzle_training_position', columns: ['training_id', 'position'])]
#[ApiResource]
class TrainingPuzzle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'trainingPuzzles')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Training $training = null;

    #[ORM\ManyToOne(inversedBy: 'trainingPuzzles')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Puzzle $puzzle = null;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    private ?int $position = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $personalNote = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTraining(): ?Training
    {
        return $this->training;
    }

    public function setTraining(?Training $training): self
    {
        $this->training = $training;

        return $this;
    }

    public function getPuzzle(): ?Puzzle
    {
        return $this->puzzle;
    }

    public function setPuzzle(?Puzzle $puzzle): self
    {
        $this->puzzle = $puzzle;

        return $this;
    }

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
    {
        $this->position = $position;

        return $this;
    }

    public function getPersonalNote(): ?string
    {
        return $this->personalNote;
    }

    public function setPersonalNote(?string $personalNote): self
    {
        $this->personalNote = $personalNote;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    #[ORM\PrePersist]
    public function initializeCreatedAt(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }
}
