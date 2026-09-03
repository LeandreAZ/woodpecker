<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260903213000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Ajoute l index composite utilisé par les recherches Lichess.";
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE INDEX idx_lichess_catalog_rating_moves ON lichess_catalog_puzzle (rating, move_count)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DROP INDEX idx_lichess_catalog_rating_moves");
    }
}
