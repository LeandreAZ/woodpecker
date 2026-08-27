<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260821194500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add persistent logo field to training';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE training ADD logo VARCHAR(32) DEFAULT NULL");
        $this->addSql("UPDATE training SET icon = COALESCE(icon, 'queen')");
        $this->addSql(<<<'SQL'
UPDATE training
SET logo = CASE icon
    WHEN 'knight' THEN 'amber-knight'
    WHEN 'bishop' THEN 'violet-bishop'
    WHEN 'rook' THEN 'cobalt-rook'
    WHEN 'pawn' THEN 'lime-pawn'
    ELSE 'teal-queen'
END
WHERE logo IS NULL
SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE training DROP logo");
    }
}
