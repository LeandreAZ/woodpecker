<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260731184500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Prevent more than one active cycle per training';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE UNIQUE INDEX uniq_cycle_active_training ON cycle (training_id) WHERE status = 'active'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX uniq_cycle_active_training');
    }
}
