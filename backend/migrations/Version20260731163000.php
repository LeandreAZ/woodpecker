<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260731163000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Prevent duplicate successful attempts for the same cycle puzzle';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE UNIQUE INDEX uniq_attempt_successful_cycle_puzzle ON attempt (cycle_puzzle_id) WHERE successful = true');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX uniq_attempt_successful_cycle_puzzle');
    }
}
