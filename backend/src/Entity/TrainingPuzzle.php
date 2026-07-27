<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\TrainingPuzzleRepository;
use App\State\OwnedTrainingResourceProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TrainingPuzzleRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\UniqueConstraint(name: 'uniq_training_puzzle_training_puzzle', columns: ['training_id', 'puzzle_id'])]
#[ORM\UniqueConstraint(name: 'uniq_training_puzzle_training_position', columns: ['training_id', 'position'])]
#[ApiResource(processor: OwnedTrainingResourceProcessor::class)]
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

    /**
     * @var Collection<int, CyclePuzzle>
     */
    #[ORM\OneToMany(mappedBy: 'trainingPuzzle', targetEntity: CyclePuzzle::class)]
    private Collection $cyclePuzzles;

    public function __construct()
    {
        $this->cyclePuzzles = new ArrayCollection();
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
            $cyclePuzzle->setTrainingPuzzle($this);
        }

        return $this;
    }

    public function removeCyclePuzzle(CyclePuzzle $cyclePuzzle): self
    {
        if ($this->cyclePuzzles->removeElement($cyclePuzzle)) {
            if ($cyclePuzzle->getTrainingPuzzle() === $this) {
                $cyclePuzzle->setTrainingPuzzle(null);
            }
        }

        return $this;
    }

    #[ORM\PrePersist]
    public function initializeCreatedAt(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }
}
