<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260731171500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Persist the preferred mistake tolerance on each training';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE training ADD mistake_limit INT DEFAULT 3 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE training DROP mistake_limit');
    }
}
