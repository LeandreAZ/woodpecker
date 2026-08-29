<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260828223000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Persist login and logout events for history';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE authentication_event (id SERIAL NOT NULL, user_id INT NOT NULL, type VARCHAR(20) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, platform VARCHAR(64) DEFAULT NULL, browser VARCHAR(64) DEFAULT NULL, device VARCHAR(64) DEFAULT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE INDEX idx_authentication_event_user_created_at ON authentication_event (user_id, created_at)');
        $this->addSql('ALTER TABLE authentication_event ADD CONSTRAINT FK_AUTHENTICATION_EVENT_USER FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE authentication_event DROP CONSTRAINT FK_AUTHENTICATION_EVENT_USER');
        $this->addSql('DROP TABLE authentication_event');
    }
}
