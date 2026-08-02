FROM composer:2 AS composer

FROM php:8.4-fpm-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        libicu-dev \
        libpq-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-install -j"$(nproc)" \
        intl \
        opcache \
        pdo_pgsql \
        zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer /usr/bin/composer /usr/local/bin/composer
COPY docker/php/entrypoint.sh /usr/local/bin/woodpecker-php-entrypoint

RUN chmod +x /usr/local/bin/woodpecker-php-entrypoint

WORKDIR /var/www/html

CMD ["woodpecker-php-entrypoint"]

