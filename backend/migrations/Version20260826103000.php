<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260826103000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add persistent branding colors to trainings';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE training ADD COLUMN IF NOT EXISTS icon_background_color VARCHAR(7) DEFAULT NULL');
        $this->addSql('ALTER TABLE training ADD COLUMN IF NOT EXISTS icon_color VARCHAR(7) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE training DROP COLUMN IF EXISTS icon_background_color');
        $this->addSql('ALTER TABLE training DROP COLUMN IF EXISTS icon_color');
    }
}
