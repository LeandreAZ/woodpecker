<?php

namespace App\ReadModel;

use App\Entity\Attempt;
use App\Entity\AuthenticationEvent;
use App\Entity\Training;
use App\Entity\User;
use App\Repository\AttemptRepository;
use App\Repository\AuthenticationEventRepository;
use App\Repository\TrainingRepository;

final class HistoryOverviewReader
{
    public function __construct(
        private readonly TrainingRepository $trainingRepository,
        private readonly AttemptRepository $attemptRepository,
        private readonly AuthenticationEventRepository $authenticationEventRepository,
    ) {
    }

    /** @return array<string, mixed> */
    public function build(User $user): array
    {
        $trainings = $this->trainingRepository->findOwnedByUserOrdered($user);
        $availableTrainings = array_map(fn (Training $training): array => $this->normalizeTraining($training), $trainings);
        $items = [];

        foreach ($trainings as $training) {
            foreach ($this->attemptRepository->findByTrainingOrdered($training) as $attempt) {
                if ('in_progress' === $attempt->getStatus()) {
                    continue;
                }

                $items[] = $this->buildAttemptHistoryItem($training, $attempt);
            }
        }

        foreach ($this->authenticationEventRepository->findByUserOrdered($user) as $authenticationEvent) {
            $items[] = $this->buildAuthenticationHistoryItem($authenticationEvent);
        }

        usort(
            $items,
            fn (array $left, array $right): int => strcmp((string) ($right['occurredAt'] ?? ''), (string) ($left['occurredAt'] ?? '')),
        );

        return [
            'availableTrainings' => $availableTrainings,
            'items' => $items,
            'latestOccurredAt' => $items[0]['occurredAt'] ?? null,
            'supportsConnectionHistory' => true,
            'totalItems' => count($items),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAttemptHistoryItem(Training $training, Attempt $attempt): array
    {
        $cyclePuzzle = $attempt->getCyclePuzzle();
        $cycle = $cyclePuzzle?->getCycle();
        $trainingPuzzle = $cyclePuzzle?->getTrainingPuzzle();
        $position = $trainingPuzzle?->getPosition() ?? $cyclePuzzle?->getPosition() ?? 0;
        $status = 'failed' === $attempt->getStatus() ? 'failed' : 'solved';

        return [
            '@id' => $this->iri('attempts', $attempt->getId()),
            'id' => $attempt->getId(),
            'activityType' => 'attempt',
            'training' => $this->normalizeTraining($training),
            'cycle' => $cycle ? $this->normalizeCycle($cycle) : null,
            'cyclePuzzle' => $cyclePuzzle ? [
                '@id' => $this->iri('cycle_puzzles', $cyclePuzzle->getId()),
                'id' => $cyclePuzzle->getId(),
                'position' => $cyclePuzzle->getPosition(),
                'status' => $cyclePuzzle->getStatus(),
            ] : null,
            'label' => sprintf('Puzzle #%d', $position + 1),
            'detail' => 'failed' === $status ? 'Tentative échouée' : 'Tentative réussie',
            'status' => $status,
            'statusLabel' => 'failed' === $status ? 'Raté' : 'Réussi',
            'attemptNumber' => $attempt->getAttemptNumber(),
            'durationMilliseconds' => $attempt->getDurationMilliseconds(),
            'occurredAt' => $this->formatDateTime($attempt->getAttemptedAt()),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAuthenticationHistoryItem(AuthenticationEvent $authenticationEvent): array
    {
        return [
            '@id' => $this->iri('authentication_events', $authenticationEvent->getId()),
            'id' => $authenticationEvent->getId(),
            'activityType' => 'login' === $authenticationEvent->getType() ? 'connection' : 'disconnection',
            'training' => null,
            'cycle' => null,
            'cyclePuzzle' => null,
            'label' => 'login' === $authenticationEvent->getType() ? 'Connexion' : 'Déconnexion',
            'detail' => $this->buildAuthenticationDetail($authenticationEvent),
            'status' => null,
            'statusLabel' => null,
            'attemptNumber' => null,
            'durationMilliseconds' => 0,
            'occurredAt' => $this->formatDateTime($authenticationEvent->getCreatedAt()),
        ];
    }

    private function buildAuthenticationDetail(AuthenticationEvent $authenticationEvent): string
    {
        $parts = array_values(array_filter([
            'expired' === $authenticationEvent->getLogoutReason() ? 'Session expirée' : null,
            $authenticationEvent->getPlatform(),
            $authenticationEvent->getBrowser(),
            $authenticationEvent->getDevice(),
        ], static fn (?string $value): bool => null !== $value && '' !== trim($value)));

        return [] === $parts ? 'Activité authentifiée' : implode(' · ', $parts);
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeTraining(Training $training): array
    {
        return [
            '@id' => $this->iri('trainings', $training->getId()),
            'id' => $training->getId(),
            'name' => $training->getName(),
            'description' => $training->getDescription(),
            'icon' => $training->getIcon(),
            'iconBackgroundColor' => $training->getIconBackgroundColor(),
            'iconColor' => $training->getIconColor(),
            'logo' => $training->getLogo(),
            'status' => $training->getStatus(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeCycle(object $cycle): array
    {
        return [
            '@id' => $this->iri('cycles', $cycle->getId()),
            'id' => $cycle->getId(),
            'training' => $this->iri('trainings', $cycle->getTraining()?->getId()),
            'number' => $cycle->getNumber(),
            'status' => $cycle->getStatus(),
            'startedAt' => $this->formatDateTime($cycle->getStartedAt()),
            'completedAt' => $this->formatDateTime($cycle->getCompletedAt()),
        ];
    }

    private function iri(string $resource, ?int $id): ?string
    {
        return null === $id ? null : sprintf('/api/%s/%d', $resource, $id);
    }

    private function formatDateTime(?\DateTimeImmutable $dateTime): ?string
    {
        return $dateTime?->format(DATE_ATOM);
    }
}
