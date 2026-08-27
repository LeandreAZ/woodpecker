<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Enum\AttemptStatus;
use App\Repository\AttemptRepository;
use App\State\OwnedTrainingResourceProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AttemptRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(name: 'idx_attempt_cycle_puzzle', columns: ['cycle_puzzle_id'])]
#[ORM\Index(name: 'idx_attempt_training_session', columns: ['training_session_id'])]
#[ORM\Index(name: 'idx_attempt_client_request_id', columns: ['client_request_id'])]
#[ApiResource(
    normalizationContext: ['groups' => ['attempt:read']],
    denormalizationContext: ['groups' => ['attempt:write']],
    processor: OwnedTrainingResourceProcessor::class,
)]
class Attempt
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['attempt:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'attempts')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['attempt:read', 'attempt:write'])]
    private ?CyclePuzzle $cyclePuzzle = null;

    #[ORM\ManyToOne(inversedBy: 'attempts')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['attempt:read', 'attempt:write'])]
    private ?TrainingSession $trainingSession = null;

    #[ORM\Column]
    #[Assert\Positive]
    #[Groups(['attempt:read', 'attempt:write'])]
    private int $attemptNumber = 1;

    #[ORM\Column(length: 20, enumType: AttemptStatus::class)]
    #[Groups(['attempt:read', 'attempt:write'])]
    private AttemptStatus $status = AttemptStatus::InProgress;

    #[ORM\Column]
    #[Groups(['attempt:read', 'attempt:write'])]
    private array $playedMoves = [];

    #[ORM\Column]
    #[Groups(['attempt:read', 'attempt:write'])]
    private bool $successful = false;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    #[Groups(['attempt:read', 'attempt:write'])]
    private int $mistakesCount = 0;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    #[Groups(['attempt:read', 'attempt:write'])]
    private int $durationMilliseconds = 0;

    #[ORM\Column(length: 64, nullable: true)]
    #[Groups(['attempt:read', 'attempt:write'])]
    private ?string $clientRequestId = null;

    #[ORM\Column]
    #[Groups(['attempt:read', 'attempt:write'])]
    private ?\DateTimeImmutable $startedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['attempt:read', 'attempt:write'])]
    private ?\DateTimeImmutable $completedAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['attempt:read'])]
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

    public function getAttemptNumber(): int
    {
        return $this->attemptNumber;
    }

    public function setAttemptNumber(int $attemptNumber): self
    {
        $this->attemptNumber = max(1, $attemptNumber);

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status->value;
    }

    public function setStatus(AttemptStatus|string $status): self
    {
        $this->status = $status instanceof AttemptStatus ? $status : AttemptStatus::from($status);

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
        $this->mistakesCount = max(0, $mistakesCount);

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

    public function getClientRequestId(): ?string
    {
        return $this->clientRequestId;
    }

    public function setClientRequestId(?string $clientRequestId): self
    {
        $this->clientRequestId = $clientRequestId;

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

    public function getAttemptedAt(): ?\DateTimeImmutable
    {
        return $this->attemptedAt;
    }

    public function setAttemptedAt(?\DateTimeImmutable $attemptedAt): self
    {
        $this->attemptedAt = $attemptedAt;

        return $this;
    }

    #[ORM\PrePersist]
    public function initializeDates(): void
    {
        $this->startedAt ??= new \DateTimeImmutable();
        $this->attemptedAt ??= $this->completedAt ?? $this->startedAt;
    }
}
