<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\CycleRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CycleRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(name: 'idx_cycle_training', columns: ['training_id'])]
#[ORM\UniqueConstraint(name: 'uniq_cycle_training_number', columns: ['training_id', 'number'])]
#[ApiResource]
class Cycle
{
    public const STATUS_PLANNED = 'planned';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'cycles')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Training $training = null;

    #[ORM\Column]
    #[Assert\Positive]
    private ?int $number = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice([self::STATUS_PLANNED, self::STATUS_ACTIVE, self::STATUS_COMPLETED])]
    private string $status = self::STATUS_PLANNED;

    #[ORM\Column(nullable: true)]
    #[Assert\Positive]
    private ?int $targetDurationSeconds = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $startedAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $completedAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    /**
     * @var Collection<int, CyclePuzzle>
     */
    #[ORM\OneToMany(mappedBy: 'cycle', targetEntity: CyclePuzzle::class, orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $cyclePuzzles;

    /**
     * @var Collection<int, TrainingSession>
     */
    #[ORM\OneToMany(mappedBy: 'cycle', targetEntity: TrainingSession::class)]
    private Collection $trainingSessions;

    public function __construct()
    {
        $this->cyclePuzzles = new ArrayCollection();
        $this->trainingSessions = new ArrayCollection();
    }

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

    public function getNumber(): ?int
    {
        return $this->number;
    }

    public function setNumber(int $number): self
    {
        $this->number = $number;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;

        return $this;
    }

    public function getTargetDurationSeconds(): ?int
    {
        return $this->targetDurationSeconds;
    }

    public function setTargetDurationSeconds(?int $targetDurationSeconds): self
    {
        $this->targetDurationSeconds = $targetDurationSeconds;

        return $this;
    }

    public function getStartedAt(): ?\DateTimeImmutable
    {
        return $this->startedAt;
    }

    public function setStartedAt(?\DateTimeImmutable $startedAt): self
    {
        $this->startedAt = $startedAt;

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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * @return Collection<int, CyclePuzzle>
     */
    public function getCyclePuzzles(): Collection
    {
        return $this->cyclePuzzles;
    }

    public function addCyclePuzzle(CyclePuzzle $cyclePuzzle): self
    {
        if (!$this->cyclePuzzles->contains($cyclePuzzle)) {
            $this->cyclePuzzles->add($cyclePuzzle);
            $cyclePuzzle->setCycle($this);
        }

        return $this;
    }

    public function removeCyclePuzzle(CyclePuzzle $cyclePuzzle): self
    {
        if ($this->cyclePuzzles->removeElement($cyclePuzzle)) {
            if ($cyclePuzzle->getCycle() === $this) {
                $cyclePuzzle->setCycle(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, TrainingSession>
     */
    public function getTrainingSessions(): Collection
    {
        return $this->trainingSessions;
    }

    public function addTrainingSession(TrainingSession $trainingSession): self
    {
        if (!$this->trainingSessions->contains($trainingSession)) {
            $this->trainingSessions->add($trainingSession);
            $trainingSession->setCycle($this);
        }

        return $this;
    }

    public function removeTrainingSession(TrainingSession $trainingSession): self
    {
        if ($this->trainingSessions->removeElement($trainingSession)) {
            if ($trainingSession->getCycle() === $this) {
                $trainingSession->setCycle(null);
            }
        }

        return $this;
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
