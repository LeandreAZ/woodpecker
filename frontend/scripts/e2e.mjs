import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('../../', import.meta.url));
const compose = ['compose', '-f', 'compose.e2e.yaml'];
function run(args) {
  const result = spawnSync('docker', [...compose, ...args], { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const args = process.argv.slice(2);
if (!args.includes('show-report')) {
  run(['up', '-d', '--wait', 'database', 'php', 'nginx', 'frontend']);
  run(['exec', '-T', 'php', 'php', 'bin/console', 'doctrine:migrations:migrate', '--no-interaction']);
  run(['exec', '-T', 'php', 'php', 'bin/console', 'app:e2e:reset']);
}
const ui = args.includes('--ui');
const report = args.includes('show-report');
run(['run', '--rm', '--build', ...(ui || report ? ['-p', '127.0.0.1:9323:9323'] : []), 'runner',
  ...(args.includes('--headed') ? ['xvfb-run', '-a'] : []),
  'npx', 'playwright', ...(report ? args : ['test', ...args]),
  ...(ui ? ['--ui-host=0.0.0.0', '--ui-port=9323'] : []),
  ...(report ? ['--host=0.0.0.0', '--port=9323'] : [])]);
