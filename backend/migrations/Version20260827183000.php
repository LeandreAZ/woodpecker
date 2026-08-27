<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260827183000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add attempt lifecycle fields for solver persistence';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE attempt ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1 NOT NULL");
        $this->addSql("ALTER TABLE attempt ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'in_progress' NOT NULL");
        $this->addSql("ALTER TABLE attempt ADD COLUMN IF NOT EXISTS started_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL");
        $this->addSql("ALTER TABLE attempt ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL");
        $this->addSql("UPDATE attempt SET status = CASE WHEN successful THEN 'solved' ELSE 'failed' END WHERE status = 'in_progress'");
        $this->addSql("UPDATE attempt SET started_at = COALESCE(started_at, attempted_at, CURRENT_TIMESTAMP)");
        $this->addSql("UPDATE attempt SET completed_at = COALESCE(completed_at, attempted_at) WHERE status IN ('failed', 'solved')");
        $this->addSql("WITH ranked AS (SELECT id, ROW_NUMBER() OVER (PARTITION BY cycle_puzzle_id ORDER BY COALESCE(attempted_at, started_at) ASC, id ASC) AS rn FROM attempt) UPDATE attempt AS attempt SET attempt_number = ranked.rn FROM ranked WHERE attempt.id = ranked.id");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE attempt DROP COLUMN IF EXISTS completed_at');
        $this->addSql('ALTER TABLE attempt DROP COLUMN IF EXISTS started_at');
        $this->addSql('ALTER TABLE attempt DROP COLUMN IF EXISTS status');
        $this->addSql('ALTER TABLE attempt DROP COLUMN IF EXISTS attempt_number');
    }
}
