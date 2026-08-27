<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260827103000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Persist solver progress directly on cycle puzzles';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE cycle_puzzle ADD COLUMN IF NOT EXISTS attempt_count INT DEFAULT 0 NOT NULL");
        $this->addSql("ALTER TABLE cycle_puzzle ADD COLUMN IF NOT EXISTS duration_milliseconds INT DEFAULT 0 NOT NULL");
        $this->addSql("ALTER TABLE cycle_puzzle ADD COLUMN IF NOT EXISTS finally_solved BOOLEAN DEFAULT FALSE NOT NULL");
        $this->addSql("UPDATE cycle_puzzle SET finally_solved = TRUE WHERE status = 'solved'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE cycle_puzzle DROP COLUMN IF EXISTS finally_solved');
        $this->addSql('ALTER TABLE cycle_puzzle DROP COLUMN IF EXISTS duration_milliseconds');
        $this->addSql('ALTER TABLE cycle_puzzle DROP COLUMN IF EXISTS attempt_count');
    }
}
