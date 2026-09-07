<?php

namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:e2e:reset', description: 'Reset only the dedicated woodpecker_e2e database.')]
final class E2eResetCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
        #[Autowire('%kernel.environment%')] private readonly string $environment,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $db = $this->em->getConnection();
        if (!in_array($this->environment, ['dev', 'test'], true)
            || '1' !== getenv('WOODPECKER_E2E')
            || 'woodpecker_e2e' !== $db->fetchOne('SELECT current_database()')) {
            $output->writeln('<error>Refused: requires dev/test, WOODPECKER_E2E=1 and database woodpecker_e2e.</error>');
            return Command::FAILURE;
        }
        $tables = ['attempt', 'cycle_puzzle', 'training_session', 'cycle', 'training_puzzle', 'training', 'authentication_event', 'user_preference', 'app_user', 'puzzle'];
        $db->beginTransaction();
        try {
            foreach ($tables as $table) {
                $output->writeln(sprintf('%s: %d rows; sample IDs %s', $table,
                    $db->fetchOne('SELECT COUNT(*) FROM '.$table),
                    implode(',', $db->fetchFirstColumn('SELECT id FROM '.$table.' ORDER BY id LIMIT 5'))));
            }
            // No CASCADE: an unexpected dependency must fail rather than broaden deletion.
            $db->executeStatement('TRUNCATE '.implode(', ', $tables).' RESTART IDENTITY');
            foreach ($tables as $table) {
                if (0 !== (int) $db->fetchOne('SELECT COUNT(*) FROM '.$table)) {
                    throw new \RuntimeException('Reset verification failed: '.$table);
                }
            }
            foreach (['owner', 'other', 'auth', 'training', 'settings', 'csv', 'mobile', 'routing'] as $name) {
                $user = (new User())->setEmail('e2e-'.$name.'@woodpecker.test')->setPseudonym('E2E '.$name);
                $user->setPassword($this->hasher->hashPassword($user, 'E2e-password-2026!'));
                $this->em->persist($user);
            }
            $this->em->flush();
            $db->commit();
        } catch (\Throwable $error) {
            $db->rollBack();
            throw $error;
        }
        $output->writeln('Dedicated E2E database reset; 8 test users created.');
        return Command::SUCCESS;
    }
}
