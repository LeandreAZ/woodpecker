<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Enum\CyclePuzzleStatus;
use App\Repository\CyclePuzzleRepository;
use App\State\OwnedTrainingResourceProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CyclePuzzleRepository::class)]
#[ORM\Index(name: 'idx_cycle_puzzle_cycle', columns: ['cycle_id'])]
#[ORM\Index(name: 'idx_cycle_puzzle_training_puzzle', columns: ['training_puzzle_id'])]
#[ORM\UniqueConstraint(name: 'uniq_cycle_puzzle_cycle_training_puzzle', columns: ['cycle_id', 'training_puzzle_id'])]
#[ORM\UniqueConstraint(name: 'uniq_cycle_puzzle_cycle_position', columns: ['cycle_id', 'position'])]
#[ApiResource(
    normalizationContext: ['groups' => ['cycle_puzzle:read']],
    denormalizationContext: ['groups' => ['cycle_puzzle:write']],
    processor: OwnedTrainingResourceProcessor::class,
)]
class CyclePuzzle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['cycle_puzzle:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'cyclePuzzles')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['cycle_puzzle:read', 'cycle_puzzle:write'])]
    private ?Cycle $cycle = null;

    #[ORM\ManyToOne(inversedBy: 'cyclePuzzles')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['cycle_puzzle:read', 'cycle_puzzle:write'])]
    private ?TrainingPuzzle $trainingPuzzle = null;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    #[Groups(['cycle_puzzle:read', 'cycle_puzzle:write'])]
    private ?int $position = null;

    #[ORM\Column(length: 20, enumType: CyclePuzzleStatus::class)]
    #[Groups(['cycle_puzzle:read', 'cycle_puzzle:write'])]
    private CyclePuzzleStatus $status = CyclePuzzleStatus::Pending;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    #[Groups(['cycle_puzzle:read', 'cycle_puzzle:write'])]
    private int $attemptCount = 0;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    #[Groups(['cycle_puzzle:read', 'cycle_puzzle:write'])]
    private int $durationMilliseconds = 0;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['cycle_puzzle:read', 'cycle_puzzle:write'])]
    private bool $finallySolved = false;

    #[ORM\Column(nullable: true)]
    #[Groups(['cycle_puzzle:read', 'cycle_puzzle:write'])]
    private ?\DateTimeImmutable $completedAt = null;

    /**
     * @var Collection<int, Attempt>
     */
    #[ORM\OneToMany(mappedBy: 'cyclePuzzle', targetEntity: Attempt::class, orphanRemoval: true)]
    private Collection $attempts;

    public function __construct()
    {
        $this->attempts = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCycle(): ?Cycle
    {
        return $this->cycle;
    }

    public function setCycle(?Cycle $cycle): self
    {
        $this->cycle = $cycle;

        return $this;
    }

    public function getTrainingPuzzle(): ?TrainingPuzzle
    {
        return $this->trainingPuzzle;
    }

    public function setTrainingPuzzle(?TrainingPuzzle $trainingPuzzle): self
    {
        $this->trainingPuzzle = $trainingPuzzle;

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

    public function getStatus(): string
    {
        return $this->status->value;
    }

    public function setStatus(CyclePuzzleStatus|string $status): self
    {
        $this->status = $status instanceof CyclePuzzleStatus ? $status : CyclePuzzleStatus::from($status);

        return $this;
    }

    public function getCompletedAt(): ?\DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function setCompletedAt(?\DateTimeImmutable $completedAt): self
    {
        $this->completedAt = $completedAt;

        return $this;
    }

    public function getAttemptCount(): int
    {
        return $this->attemptCount;
    }

    public function setAttemptCount(int $attemptCount): self
    {
        $this->attemptCount = max(0, $attemptCount);

        return $this;
    }

    public function getDurationMilliseconds(): int
    {
        return $this->durationMilliseconds;
    }

    public function setDurationMilliseconds(int $durationMilliseconds): self
    {
        $this->durationMilliseconds = max(0, $durationMilliseconds);

        return $this;
    }

    public function isFinallySolved(): bool
    {
        return $this->finallySolved;
    }

    public function setFinallySolved(bool $finallySolved): self
    {
        $this->finallySolved = $finallySolved;

        return $this;
    }

    /**
     * @return Collection<int, Attempt>
     */
    public function getAttempts(): Collection
    {
        return $this->attempts;
    }

    public function addAttempt(Attempt $attempt): self
    {
        if (!$this->attempts->contains($attempt)) {
            $this->attempts->add($attempt);
            $attempt->setCyclePuzzle($this);
        }

        return $this;
    }

    public function removeAttempt(Attempt $attempt): self
    {
        if ($this->attempts->removeElement($attempt)) {
            if ($attempt->getCyclePuzzle() === $this) {
                $attempt->setCyclePuzzle(null);
            }
        }

        return $this;
    }
}
