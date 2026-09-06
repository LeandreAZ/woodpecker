#!/bin/sh
set -eu

cd /var/www/html

mkdir -p config/jwt vendor

# Avatar uploads live on the bind mount and must be writable by the PHP-FPM worker.
mkdir -p public/uploads/avatars
chmod 0777 public/uploads/avatars

if [ ! -f vendor/autoload.php ]; then
  echo "[php] Installing Composer dependencies..."
  composer install --no-interaction --prefer-dist
fi

if [ ! -f config/jwt/private.pem ] || [ ! -f config/jwt/public.pem ]; then
  echo "[php] Generating JWT keypair..."
  php bin/console lexik:jwt:generate-keypair --skip-if-exists
fi

echo "[php] Running database migrations..."
php bin/console doctrine:migrations:migrate --no-interaction

exec php-fpm
