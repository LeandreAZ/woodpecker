<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260829123000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add pseudonym and avatar_url columns to app_user';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE app_user ADD pseudonym VARCHAR(80) DEFAULT '' NOT NULL");
        $this->addSql('ALTER TABLE app_user ADD avatar_url VARCHAR(512) DEFAULT NULL');
        $this->addSql("UPDATE app_user AS u SET pseudonym = COALESCE(NULLIF(TRIM(up.display_name), ''), NULLIF(SPLIT_PART(u.email, '@', 1), ''), u.email) FROM user_preference AS up WHERE up.user_id = u.id");
        $this->addSql("UPDATE app_user SET pseudonym = COALESCE(NULLIF(SPLIT_PART(email, '@', 1), ''), email) WHERE pseudonym = ''");
        $this->addSql('ALTER TABLE app_user ALTER COLUMN pseudonym DROP DEFAULT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user DROP avatar_url');
        $this->addSql('ALTER TABLE app_user DROP pseudonym');
    }
}
