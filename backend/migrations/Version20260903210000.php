<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260903210000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add indexed local Lichess puzzle catalog';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE lichess_catalog_puzzle (external_id VARCHAR(32) NOT NULL, fen TEXT NOT NULL, moves TEXT NOT NULL, rating SMALLINT NOT NULL, themes TEXT[] NOT NULL DEFAULT ARRAY[]::text[], opening_tags TEXT[] NOT NULL DEFAULT ARRAY[]::text[], move_count SMALLINT NOT NULL, PRIMARY KEY(external_id))');
        $this->addSql('CREATE INDEX idx_lichess_catalog_rating ON lichess_catalog_puzzle (rating)');
        $this->addSql('CREATE INDEX idx_lichess_catalog_move_count ON lichess_catalog_puzzle (move_count)');
        $this->addSql('CREATE INDEX idx_lichess_catalog_themes ON lichess_catalog_puzzle USING GIN (themes)');
        $this->addSql('CREATE INDEX idx_lichess_catalog_opening_tags ON lichess_catalog_puzzle USING GIN (opening_tags)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE lichess_catalog_puzzle');
    }
}
