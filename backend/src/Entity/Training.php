<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Controller\HistoryOverviewAction;
use App\Controller\StatsOverviewAction;
use App\Controller\TrainingAnalyticsAction;
use App\Controller\TrainingAttemptHistoryAction;
use App\Controller\TrainingCycleHistoryAction;
use App\Controller\TrainingDashboardAction;
use App\Controller\TrainingOverviewAction;
use App\Controller\TrainingSummaryAction;
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
    operations: [
        new Get(requirements: ['id' => '\\d+']),
        new GetCollection(),
        new GetCollection(
            uriTemplate: '/trainings/dashboard',
            controller: TrainingDashboardAction::class,
            read: false,
            name: 'training_dashboard',
        ),
        new GetCollection(
            uriTemplate: '/stats/overview',
            controller: StatsOverviewAction::class,
            read: false,
            name: 'stats_overview',
        ),
        new GetCollection(
            uriTemplate: '/history/overview',
            controller: HistoryOverviewAction::class,
            read: false,
            name: 'history_overview',
        ),
        new Post(processor: TrainingOwnerProcessor::class),
        new Patch(requirements: ['id' => '\\d+'], processor: TrainingOwnerProcessor::class),
        new Delete(requirements: ['id' => '\\d+']),
        new Get(
            uriTemplate: '/trainings/{id}/overview',
            controller: TrainingOverviewAction::class,
            read: false,
            name: 'training_overview',
            requirements: ['id' => '\\d+'],
        ),
        new Get(
            uriTemplate: '/trainings/{id}/summary',
            controller: TrainingSummaryAction::class,
            read: false,
            name: 'training_summary',
            requirements: ['id' => '\\d+'],
        ),
        new Get(
            uriTemplate: '/trainings/{id}/analytics',
            controller: TrainingAnalyticsAction::class,
            read: false,
            name: 'training_analytics',
            requirements: ['id' => '\\d+'],
        ),
        new Get(
            uriTemplate: '/trainings/{id}/attempt-history',
            controller: TrainingAttemptHistoryAction::class,
            read: false,
            name: 'training_attempt_history',
            requirements: ['id' => '\\d+'],
        ),
        new Get(
            uriTemplate: '/trainings/{id}/cycle-history',
            controller: TrainingCycleHistoryAction::class,
            read: false,
            name: 'training_cycle_history',
            requirements: ['id' => '\\d+'],
        ),
    ],
    normalizationContext: ['groups' => ['training:read']],
    denormalizationContext: ['groups' => ['training:write']],
)]
class Training
{
    private const ALLOWED_ICONS = ['pawn', 'king', 'queen', 'knight', 'bishop', 'rook'];
    private const LOGO_PALETTES = ['cobalt', 'lime', 'violet', 'amber', 'teal'];

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

    #[ORM\Column(length: 32, nullable: true)]
    #[Groups(['training:read', 'training:write'])]
    private ?string $icon = null;

    #[ORM\Column(length: 7, nullable: true)]
    #[Assert\Regex(pattern: '/^#[0-9A-Fa-f]{6}$/')]
    #[Groups(['training:read', 'training:write'])]
    private ?string $iconBackgroundColor = null;

    #[ORM\Column(length: 7, nullable: true)]
    #[Assert\Regex(pattern: '/^#[0-9A-Fa-f]{6}$/')]
    #[Groups(['training:read', 'training:write'])]
    private ?string $iconColor = null;

    private ?string $logo = null;

    #[ORM\Column(length: 20, enumType: TrainingStatus::class)]
    #[Groups(['training:read', 'training:write'])]
    private TrainingStatus $status = TrainingStatus::Draft;

    #[ORM\Column(options: ['default' => 3])]
    #[Assert\Range(min: 1, max: 20)]
    #[Groups(['training:read', 'training:write'])]
    private int $mistakeLimit = 3;

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

    public function getIcon(): string
    {
        return $this->normalizeIcon($this->icon);
    }

    public function setIcon(?string $icon): self
    {
        $this->icon = $this->normalizeIcon($icon);

        return $this;
    }

    public function getIconBackgroundColor(): string
    {
        return $this->normalizeColor($this->iconBackgroundColor) ?? $this->resolveLegacyBackgroundColor();
    }

    public function setIconBackgroundColor(?string $iconBackgroundColor): self
    {
        $this->iconBackgroundColor = $this->normalizeColor($iconBackgroundColor);

        return $this;
    }

    public function getIconColor(): string
    {
        return $this->normalizeColor($this->iconColor) ?? '#ffffff';
    }

    public function setIconColor(?string $iconColor): self
    {
        $this->iconColor = $this->normalizeColor($iconColor);

        return $this;
    }

    #[Groups(['training:read'])]
    public function getLogo(): string
    {
        return $this->logo ?? $this->buildDefaultLogo();
    }

    public function setLogo(?string $logo): self
    {
        $this->logo = null === $logo || '' === trim($logo) ? null : trim($logo);

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

    public function getMistakeLimit(): int
    {
        return $this->mistakeLimit;
    }

    public function setMistakeLimit(int $mistakeLimit): self
    {
        $this->mistakeLimit = $mistakeLimit;

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
        $this->ensureBranding();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function refreshUpdatedAt(): void
    {
        $this->ensureBranding();
        $this->updatedAt = new \DateTimeImmutable();
    }

    private function ensureBranding(): void
    {
        $this->icon = $this->normalizeIcon($this->icon);
        $this->iconBackgroundColor = $this->normalizeColor($this->iconBackgroundColor);
        $this->iconColor = $this->normalizeColor($this->iconColor) ?? '#ffffff';
        $this->logo ??= $this->buildDefaultLogo();
    }

    private function buildDefaultLogo(): string
    {
        $seed = sprintf('%s-%s-%s', $this->name ?? 'training', $this->icon ?? 'rook', $this->id ?? 'new');
        $paletteIndex = abs(crc32($seed)) % count(self::LOGO_PALETTES);

        return sprintf('%s-%s', self::LOGO_PALETTES[$paletteIndex], $this->normalizeIcon($this->icon));
    }

    private function normalizeIcon(?string $icon): string
    {
        $normalized = strtolower(trim($icon ?? ''));

        return in_array($normalized, self::ALLOWED_ICONS, true) ? $normalized : 'rook';
    }

    private function normalizeColor(?string $color): ?string
    {
        $normalized = strtolower(trim($color ?? ''));

        if ('' === $normalized || !preg_match('/^#[0-9a-f]{6}$/', $normalized)) {
            return null;
        }

        return $normalized;
    }

    private function resolveLegacyBackgroundColor(): string
    {
        return match (explode('-', $this->buildDefaultLogo())[0] ?? '') {
            'lime' => '#7ebd2a',
            'amber' => '#cc8d24',
            'teal' => '#1f9ca8',
            'cobalt' => '#2b63d9',
            'violet' => '#7c5cff',
            default => '#3b82f6',
        };
    }
}

