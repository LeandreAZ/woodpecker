<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260829001500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Track logout reason and deduplicate authentication events per JWT token';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE authentication_event ADD logout_reason VARCHAR(20) DEFAULT NULL');
        $this->addSql('ALTER TABLE authentication_event ADD token_fingerprint VARCHAR(64) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX uniq_authentication_event_token_fingerprint ON authentication_event (token_fingerprint)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX uniq_authentication_event_token_fingerprint');
        $this->addSql('ALTER TABLE authentication_event DROP token_fingerprint');
        $this->addSql('ALTER TABLE authentication_event DROP logout_reason');
    }
}
