<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260813100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Add icon field to training";
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE training ADD icon VARCHAR(32) DEFAULT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE training DROP icon");
    }
}
