<?php

namespace App\Entity;

use App\Enum\AuthenticationEventType;
use App\Repository\AuthenticationEventRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AuthenticationEventRepository::class)]
#[ORM\Table(name: 'authentication_event')]
#[ORM\Index(name: 'idx_authentication_event_user_created_at', columns: ['user_id', 'created_at'])]
class AuthenticationEvent
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(length: 20, enumType: AuthenticationEventType::class)]
    private AuthenticationEventType $type = AuthenticationEventType::Login;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $platform = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $browser = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $device = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $logoutReason = null;

    #[ORM\Column(length: 64, nullable: true, unique: true)]
    private ?string $tokenFingerprint = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getType(): string
    {
        return $this->type->value;
    }

    public function setType(AuthenticationEventType|string $type): self
    {
        $this->type = $type instanceof AuthenticationEventType ? $type : AuthenticationEventType::from($type);

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getPlatform(): ?string
    {
        return $this->platform;
    }

    public function setPlatform(?string $platform): self
    {
        $this->platform = $platform;

        return $this;
    }

    public function getBrowser(): ?string
    {
        return $this->browser;
    }

    public function setBrowser(?string $browser): self
    {
        $this->browser = $browser;

        return $this;
    }

    public function getDevice(): ?string
    {
        return $this->device;
    }

    public function setDevice(?string $device): self
    {
        $this->device = $device;

        return $this;
    }

    public function getLogoutReason(): ?string
    {
        return $this->logoutReason;
    }

    public function setLogoutReason(?string $logoutReason): self
    {
        $this->logoutReason = $logoutReason;

        return $this;
    }

    public function getTokenFingerprint(): ?string
    {
        return $this->tokenFingerprint;
    }

    public function setTokenFingerprint(?string $tokenFingerprint): self
    {
        $this->tokenFingerprint = $tokenFingerprint;

        return $this;
    }
}
