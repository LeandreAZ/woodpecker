<?php
namespace App\Tests\Controller;

use App\Controller\TrainingPuzzleImportAction;
use App\Entity\Puzzle;
use App\Entity\Training;
use App\Entity\User;
use App\Import\CsvPuzzleParser;
use App\Import\LichessDatasetProvider;
use App\Import\TrainingCsvAnalysisService;
use App\Import\TrainingPuzzleImportService;
use App\Repository\TrainingRepository;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class TrainingPuzzleImportActionTest extends TestCase
{
    private Security&MockObject $security;
    private TrainingRepository&MockObject $trainingRepository;
    private Connection&MockObject $connection;
    private EntityManagerInterface&MockObject $entityManager;
    private EntityRepository&MockObject $puzzleRepository;
    private TrainingPuzzleImportAction $action;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->trainingRepository = $this->createMock(TrainingRepository::class);
        $this->connection = $this->createMock(Connection::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->puzzleRepository = $this->createMock(EntityRepository::class);

        $this->entityManager->method('getConnection')->willReturn($this->connection);
        $this->entityManager->method('getRepository')->with(Puzzle::class)->willReturn($this->puzzleRepository);
        $this->puzzleRepository->method('findOneBy')->willReturn(null);
        $this->entityManager->method('persist');
        $this->entityManager->method('flush');
        $this->connection->method('beginTransaction');
        $this->connection->method('commit');

        $this->action = new TrainingPuzzleImportAction(
            $this->security,
            $this->trainingRepository,
            new CsvPuzzleParser(),
            new LichessDatasetProvider($this->connection),
            new TrainingCsvAnalysisService(),
            new TrainingPuzzleImportService($this->entityManager),
            new ArrayAdapter(),
        );
    }

    public function testAnalyzeThenImportCsvReusesAnalysisIdCache(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $this->setEntityId($owner, 10);
        $training = (new Training())->setName('CSV')->setOwner($owner);
        $this->setEntityId($training, 7);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository->method('findOneOwnedByUser')->with(7, $owner)->willReturn($training);

        $response = $this->action->analyzeCsv(7, new Request([], [], [], [], ['file' => $this->createUploadedCsvFile()]));
        $payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertMatchesRegularExpression('/^[a-f0-9]{32}$/', $payload['analysisId']);
        self::assertSame(1, $payload['totalRows']);
        self::assertSame(1, $payload['validCount']);
        self::assertSame(1, $payload['importableCount']);
        self::assertCount(1, $payload['rows']);

        $importResponse = $this->action->importCsv(7, new Request([], ['analysisId' => $payload['analysisId'], 'skipDuplicates' => 'true', 'skipErroredPuzzles' => 'true']));
        $importPayload = json_decode($importResponse->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(201, $importResponse->getStatusCode());
        self::assertSame(1, $importPayload['importedCount']);
        self::assertSame('csv', $importPayload['source']);
    }

    public function testImportCsvRejectsExpiredAnalysis(): void
    {
        $owner = (new User())->setEmail('owner@example.com');
        $this->setEntityId($owner, 10);
        $training = (new Training())->setName('CSV')->setOwner($owner);
        $this->setEntityId($training, 7);

        $this->security->method('getUser')->willReturn($owner);
        $this->trainingRepository->method('findOneOwnedByUser')->with(7, $owner)->willReturn($training);

        $this->expectException(BadRequestHttpException::class);

        $this->action->importCsv(7, new Request([], ['analysisId' => 'missing']));
    }

    private function createUploadedCsvFile(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'csv-import-');
        file_put_contents($path, "fen,moves,rating,puzzleid,themes
6k1/5ppp/8/7Q/8/3B4/6PP/6K1 w - - 0 1,h5h7,1500,fresh-1,fork
");

        return new UploadedFile($path, 'puzzles.csv', 'text/csv', null, true);
    }

    private function setEntityId(object $entity, int $id): void
    {
        $reflection = new \ReflectionProperty($entity, 'id');
        $reflection->setValue($entity, $id);
    }
}
