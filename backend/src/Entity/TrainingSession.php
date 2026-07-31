<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\TrainingSessionRepository;
use App\State\OwnedTrainingResourceProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: TrainingSessionRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(name: 'idx_training_session_training', columns: ['training_id'])]
#[ORM\Index(name: 'idx_training_session_cycle', columns: ['cycle_id'])]
#[ApiResource(
    normalizationContext: ['groups' => ['training_session:read']],
    denormalizationContext: ['groups' => ['training_session:write']],
    processor: OwnedTrainingResourceProcessor::class,
)]
class TrainingSession
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['training_session:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'trainingSessions')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['training_session:read', 'training_session:write'])]
    private ?Training $training = null;

    #[ORM\ManyToOne(inversedBy: 'trainingSessions')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['training_session:read', 'training_session:write'])]
    private ?Cycle $cycle = null;

    #[ORM\Column]
    #[Groups(['training_session:read'])]
    private ?\DateTimeImmutable $startedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['training_session:read', 'training_session:write'])]
    private ?\DateTimeImmutable $endedAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['training_session:read', 'training_session:write'])]
    private ?string $note = null;

    /**
     * @var Collection<int, Attempt>
     */
    #[ORM\OneToMany(mappedBy: 'trainingSession', targetEntity: Attempt::class, orphanRemoval: true)]
    private Collection $attempts;

    public function __construct()
    {
        $this->attempts = new ArrayCollection();
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

    public function getCycle(): ?Cycle
    {
        return $this->cycle;
    }

    public function setCycle(?Cycle $cycle): self
    {
        $this->cycle = $cycle;

        return $this;
    }

    public function getStartedAt(): ?\DateTimeImmutable
    {
        return $this->startedAt;
    }

    public function setStartedAt(\DateTimeImmutable $startedAt): self
    {
        $this->startedAt = $startedAt;

        return $this;
    }

    public function getEndedAt(): ?\DateTimeImmutable
    {
        return $this->endedAt;
    }

    public function setEndedAt(?\DateTimeImmutable $endedAt): self
    {
        $this->endedAt = $endedAt;

        return $this;
    }

    public function getNote(): ?string
    {
        return $this->note;
    }

    public function setNote(?string $note): self
    {
        $this->note = $note;

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
            $attempt->setTrainingSession($this);
        }

        return $this;
    }

    public function removeAttempt(Attempt $attempt): self
    {
        if ($this->attempts->removeElement($attempt)) {
            if ($attempt->getTrainingSession() === $this) {
                $attempt->setTrainingSession(null);
            }
        }

        return $this;
    }

    #[ORM\PrePersist]
    public function initializeStartedAt(): void
    {
        $this->startedAt ??= new \DateTimeImmutable();
    }
}
