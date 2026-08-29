<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260827193000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove legacy solver aggregate columns and switch successful-attempt uniqueness to status';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS uniq_attempt_successful_cycle_puzzle');
        $this->addSql("CREATE UNIQUE INDEX IF NOT EXISTS uniq_attempt_solved_cycle_puzzle ON attempt (cycle_puzzle_id) WHERE status = 'solved'");
        $this->addSql('ALTER TABLE cycle_puzzle DROP COLUMN IF EXISTS attempt_count');
        $this->addSql('ALTER TABLE cycle_puzzle DROP COLUMN IF EXISTS finally_solved');
        $this->addSql('ALTER TABLE attempt DROP COLUMN IF EXISTS successful');
        $this->addSql('ALTER TABLE attempt DROP COLUMN IF EXISTS attempted_at');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE cycle_puzzle ADD attempt_count INT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE cycle_puzzle ADD finally_solved BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE attempt ADD successful BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE attempt ADD attempted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql("UPDATE attempt SET successful = (status = 'solved')");
        $this->addSql('UPDATE attempt SET attempted_at = COALESCE(completed_at, started_at)');
        $this->addSql('DROP INDEX IF EXISTS uniq_attempt_solved_cycle_puzzle');
        $this->addSql("CREATE UNIQUE INDEX IF NOT EXISTS uniq_attempt_successful_cycle_puzzle ON attempt (cycle_puzzle_id) WHERE successful = true");
    }
}
