<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Enum\TrainingStatus;
use App\Repository\TrainingRepository;
use App\State\TrainingOwnerProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TrainingRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    normalizationContext: ['groups' => ['training:read']],
    denormalizationContext: ['groups' => ['training:write']],
    processor: TrainingOwnerProcessor::class,
)]
class Training
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['training:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    #[Groups(['training:read', 'training:write'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['training:read', 'training:write'])]
    private ?string $description = null;

    #[ORM\Column(length: 20, enumType: TrainingStatus::class)]
    #[Groups(['training:read', 'training:write'])]
    private TrainingStatus $status = TrainingStatus::Draft;

    #[ORM\Column]
    #[Groups(['training:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['training:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['training:read'])]
    private ?\DateTimeImmutable $firstCycleStartedAt = null;

    #[ORM\ManyToOne(inversedBy: 'trainings')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['training:read'])]
    private ?User $owner = null;

    /**
     * @var Collection<int, TrainingPuzzle>
     */
    #[ORM\OneToMany(mappedBy: 'training', targetEntity: TrainingPuzzle::class, orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $trainingPuzzles;

    /**
     * @var Collection<int, Cycle>
     */
    #[ORM\OneToMany(mappedBy: 'training', targetEntity: Cycle::class, orphanRemoval: true)]
    #[ORM\OrderBy(['number' => 'ASC'])]
    private Collection $cycles;

    /**
     * @var Collection<int, TrainingSession>
     */
    #[ORM\OneToMany(mappedBy: 'training', targetEntity: TrainingSession::class, orphanRemoval: true)]
    private Collection $trainingSessions;

    public function __construct()
    {
        $this->trainingPuzzles = new ArrayCollection();
        $this->cycles = new ArrayCollection();
        $this->trainingSessions = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status->value;
    }

    public function setStatus(TrainingStatus|string $status): self
    {
        $this->status = $status instanceof TrainingStatus ? $status : TrainingStatus::from($status);

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

    public function getFirstCycleStartedAt(): ?\DateTimeImmutable
    {
        return $this->firstCycleStartedAt;
    }

    public function setFirstCycleStartedAt(?\DateTimeImmutable $firstCycleStartedAt): self
    {
        $this->firstCycleStartedAt = $firstCycleStartedAt;

        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): self
    {
        $this->owner = $owner;

        return $this;
    }

    /**
     * @return Collection<int, TrainingPuzzle>
     */
    public function getTrainingPuzzles(): Collection
    {
        return $this->trainingPuzzles;
    }

    public function addTrainingPuzzle(TrainingPuzzle $trainingPuzzle): self
    {
        if (!$this->trainingPuzzles->contains($trainingPuzzle)) {
            $this->trainingPuzzles->add($trainingPuzzle);
            $trainingPuzzle->setTraining($this);
        }

        return $this;
    }

    public function removeTrainingPuzzle(TrainingPuzzle $trainingPuzzle): self
    {
        if ($this->trainingPuzzles->removeElement($trainingPuzzle)) {
            if ($trainingPuzzle->getTraining() === $this) {
                $trainingPuzzle->setTraining(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Cycle>
     */
    public function getCycles(): Collection
    {
        return $this->cycles;
    }

    public function addCycle(Cycle $cycle): self
    {
        if (!$this->cycles->contains($cycle)) {
            $this->cycles->add($cycle);
            $cycle->setTraining($this);
        }

        return $this;
    }

    public function removeCycle(Cycle $cycle): self
    {
        if ($this->cycles->removeElement($cycle)) {
            if ($cycle->getTraining() === $this) {
                $cycle->setTraining(null);
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
            $trainingSession->setTraining($this);
        }

        return $this;
    }

    public function removeTrainingSession(TrainingSession $trainingSession): self
    {
        if ($this->trainingSessions->removeElement($trainingSession)) {
            if ($trainingSession->getTraining() === $this) {
                $trainingSession->setTraining(null);
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
