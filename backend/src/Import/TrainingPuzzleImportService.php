<?php

namespace App\Import;

use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\TrainingPuzzle;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class TrainingPuzzleImportService
{
    public function __construct(private readonly EntityManagerInterface $entityManager) {}

    /** @param list<NormalizedPuzzle> $normalizedPuzzles @return array{trainingId: int|null, cycleId: int|null, importedCount: int, source: string} */
    public function import(
        User $user,
        Training $training,
        array $normalizedPuzzles,
        string $source,
        bool $skipDuplicates = true,
    ): array {
        if ([] === $normalizedPuzzles) {
            throw new \InvalidArgumentException('Aucun puzzle valide a importer.');
        }
        if ($training->getOwner()?->getId() !== $user->getId()) {
            throw new ConflictHttpException('Cet entrainement ne vous appartient pas.');
        }

        $existingTrainingPuzzleKeys = [];
        foreach ($training->getTrainingPuzzles() as $trainingPuzzle) {
            $puzzle = $trainingPuzzle->getPuzzle();
            if (!($puzzle instanceof Puzzle)) {
                continue;
            }
            foreach (
                $this->buildPuzzleKeys(
                    $puzzle->getFen() ?? '',
                    $puzzle->getSolution(),
                    $puzzle->getSource(),
                    $puzzle->getExternalId(),
                )
                as $key
            ) {
                $existingTrainingPuzzleKeys[$key] = true;
            }
        }

        $position = $training->getTrainingPuzzles()->count();
        $importedCount = 0;
        $connection = $this->entityManager->getConnection();
        $connection->beginTransaction();
        try {
            foreach ($normalizedPuzzles as $normalizedPuzzle) {
                $candidateKeys = $this->buildPuzzleKeys(
                    $normalizedPuzzle->fen,
                    $normalizedPuzzle->solution,
                    $source,
                    $normalizedPuzzle->sourceId,
                );
                if (
                    $skipDuplicates &&
                    $this->hasMatchingPuzzleKey($existingTrainingPuzzleKeys, $candidateKeys)
                ) {
                    continue;
                }

                $puzzle = $this->findOrCreatePuzzle($normalizedPuzzle, $source);
                $trainingPuzzle = (new TrainingPuzzle())
                    ->setTraining($training)
                    ->setPuzzle($puzzle)
                    ->setPosition($position);
                $this->entityManager->persist($trainingPuzzle);

                foreach ($candidateKeys as $candidateKey) {
                    $existingTrainingPuzzleKeys[$candidateKey] = true;
                }
                ++$position;
                ++$importedCount;
            }

            $this->entityManager->flush();
            $connection->commit();
            return [
                'trainingId' => $training->getId(),
                'cycleId' => null,
                'importedCount' => $importedCount,
                'source' => $source,
            ];
        } catch (\Throwable $exception) {
            $connection->rollBack();
            throw $exception;
        }
    }

    private function findOrCreatePuzzle(NormalizedPuzzle $normalizedPuzzle, string $source): Puzzle
    {
        $puzzle = null;
        if (null !== $normalizedPuzzle->sourceId) {
            $puzzle = $this->entityManager
                ->getRepository(Puzzle::class)
                ->findOneBy(['source' => $source, 'externalId' => $normalizedPuzzle->sourceId]);
        }
        if (!($puzzle instanceof Puzzle)) {
            $puzzle = (new Puzzle())
                ->setSource($source)
                ->setExternalId($normalizedPuzzle->sourceId)
                ->setFen($normalizedPuzzle->fen)
                ->setSolution($normalizedPuzzle->solution)
                ->setThemes($normalizedPuzzle->themes)
                ->setRating($normalizedPuzzle->rating);
            $this->entityManager->persist($puzzle);
        }
        return $puzzle;
    }

    /** @param list<string> $solution @return list<string> */
    private function buildPuzzleKeys(string $fen, array $solution, ?string $source, ?string $sourceId): array
    {
        $keys = [sprintf('fingerprint:%s', hash('sha256', $fen . '|' . implode(' ', $solution)))];
        if (null !== $source && null !== $sourceId && '' !== $sourceId) {
            $keys[] = sprintf('source:%s:%s', $source, $sourceId);
        }
        return $keys;
    }

    /** @param array<string, true> $existingTrainingPuzzleKeys @param list<string> $candidateKeys */
    private function hasMatchingPuzzleKey(array $existingTrainingPuzzleKeys, array $candidateKeys): bool
    {
        foreach ($candidateKeys as $candidateKey) {
            if (isset($existingTrainingPuzzleKeys[$candidateKey])) {
                return true;
            }
        }
        return false;
    }
}
