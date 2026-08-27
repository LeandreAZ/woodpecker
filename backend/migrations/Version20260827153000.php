<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260827153000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add idempotent client request ids to attempts';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE attempt ADD COLUMN IF NOT EXISTS client_request_id VARCHAR(64) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS idx_attempt_client_request_id ON attempt (client_request_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS idx_attempt_client_request_id');
        $this->addSql('ALTER TABLE attempt DROP COLUMN IF EXISTS client_request_id');
    }
}
