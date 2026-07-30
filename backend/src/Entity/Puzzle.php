<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\PuzzleRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PuzzleRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\UniqueConstraint(name: 'uniq_puzzle_source_external_id', columns: ['source', 'external_id'])]
#[ApiResource(
    normalizationContext: ['groups' => ['puzzle:read']],
    denormalizationContext: ['groups' => ['puzzle:write']],
)]
class Puzzle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['puzzle:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Assert\Length(max: 50)]
    #[Groups(['puzzle:read', 'puzzle:write'])]
    private ?string $source = null;

    #[ORM\Column(length: 120, nullable: true)]
    #[Assert\Length(max: 120)]
    #[Groups(['puzzle:read', 'puzzle:write'])]
    private ?string $externalId = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['puzzle:read', 'puzzle:write'])]
    private ?string $fen = null;

    #[ORM\Column]
    #[Assert\NotBlank]
    #[Groups(['puzzle:read', 'puzzle:write'])]
    private array $solution = [];

    #[ORM\Column]
    #[Groups(['puzzle:read', 'puzzle:write'])]
    private array $themes = [];

    #[ORM\Column(nullable: true)]
    #[Assert\Positive]
    #[Groups(['puzzle:read', 'puzzle:write'])]
    private ?int $rating = null;

    #[ORM\Column]
    #[Groups(['puzzle:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * @var Collection<int, TrainingPuzzle>
     */
    #[ORM\OneToMany(mappedBy: 'puzzle', targetEntity: TrainingPuzzle::class)]
    private Collection $trainingPuzzles;

    public function __construct()
    {
        $this->trainingPuzzles = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSource(): ?string
    {
        return $this->source;
    }

    public function setSource(?string $source): self
    {
        $this->source = $source;

        return $this;
    }

    public function getExternalId(): ?string
    {
        return $this->externalId;
    }

    public function setExternalId(?string $externalId): self
    {
        $this->externalId = $externalId;

        return $this;
    }

    public function getFen(): ?string
    {
        return $this->fen;
    }

    public function setFen(?string $fen): self
    {
        $this->fen = $fen;

        return $this;
    }

    public function getSolution(): array
    {
        return $this->solution;
    }

    public function setSolution(array $solution): self
    {
        $this->solution = $solution;

        return $this;
    }

    public function getThemes(): array
    {
        return $this->themes;
    }

    public function setThemes(array $themes): self
    {
        $this->themes = $themes;

        return $this;
    }

    public function getRating(): ?int
    {
        return $this->rating;
    }

    public function setRating(?int $rating): self
    {
        $this->rating = $rating;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
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
            $trainingPuzzle->setPuzzle($this);
        }

        return $this;
    }

    public function removeTrainingPuzzle(TrainingPuzzle $trainingPuzzle): self
    {
        if ($this->trainingPuzzles->removeElement($trainingPuzzle)) {
            if ($trainingPuzzle->getPuzzle() === $this) {
                $trainingPuzzle->setPuzzle(null);
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
