# Référence — dépendances et versions exactes

## Frontend

| Package | Version déclarée | Version lockée | Usage |
|---|---|---|---|
| `@tanstack/react-query` | `^5.0.0` | `5.101.4` | cache/queries/mutations serveur |
| `@vitejs/plugin-react` | `^5.0.0` | `5.2.0` | tooling/dépendance frontend |
| `chess.js` | `^1.0.0` | `1.4.0` | logique échiquéenne côté navigateur |
| `country-flag-icons` | `^1.6.20` | `1.6.20` | drapeaux/langues |
| `lucide-react` | `^1.34.0` | `1.34.0` | icônes |
| `react` | `^19.0.0` | `19.2.8` | UI composants/hooks |
| `react-chessboard` | `^5.0.0` | `5.10.0` | échiquier interactif |
| `react-dom` | `^19.0.0` | `19.2.8` | rendu DOM |
| `typescript` | `^5.0.0` | `5.9.3` | types/compilation |
| `vite` | `^7.0.0` | `7.3.6` | dev server/build |
| `@eslint/js` | `^9.0.0` | `9.39.5` | tooling/dépendance frontend |
| `@playwright/test` | `1.63.0` | `1.63.0` | E2E |
| `@testing-library/jest-dom` | `^6.9.1` | `6.9.1` | tooling/dépendance frontend |
| `@testing-library/react` | `^16.3.0` | `16.3.2` | tests composants |
| `@types/node` | `^24.0.0` | `24.13.3` | tooling/dépendance frontend |
| `@types/react` | `^19.0.0` | `19.2.17` | tooling/dépendance frontend |
| `@types/react-dom` | `^19.0.0` | `19.2.3` | tooling/dépendance frontend |
| `eslint` | `^10.8.0` | `10.8.0` | tooling/dépendance frontend |
| `eslint-plugin-react-hooks` | `^7.1.1` | `7.1.1` | tooling/dépendance frontend |
| `eslint-plugin-react-refresh` | `^0.5.3` | `0.5.3` | tooling/dépendance frontend |
| `globals` | `^16.0.0` | `16.5.0` | tooling/dépendance frontend |
| `jsdom` | `^26.1.0` | `26.1.0` | tooling/dépendance frontend |
| `typescript-eslint` | `^8.0.0` | `8.65.0` | tooling/dépendance frontend |
| `vitest` | `^3.2.4` | `3.2.7` | tests frontend |

## Backend

| Package | Version lockée | Usage |
|---|---|---|
| `aglaia-resident/chess.php` | `v2.2.0` | validation échecs backend |
| `api-platform/doctrine-orm` | `v4.3.17` | bridge Doctrine API Platform |
| `api-platform/symfony` | `v4.3.17` | API Platform |
| `doctrine/doctrine-bundle` | `3.3.1` | intégration Symfony Doctrine |
| `doctrine/doctrine-migrations-bundle` | `4.0.0` | migrations |
| `doctrine/orm` | `3.6.7` | ORM |
| `lexik/jwt-authentication-bundle` | `v3.2.0` | JWT |
| `nelmio/cors-bundle` | `2.6.1` | CORS |
| `phpdocumentor/reflection-docblock` | `6.0.3` | lecture et analyse de PHPDoc |
| `phpstan/phpdoc-parser` | `2.3.3` | parsing des types PHPDoc |
| `symfony/asset` | `v7.4.8` | composant Symfony |
| `symfony/cache` | `v7.4.14` | composant Symfony |
| `symfony/cache-contracts` | `v3.7.1` | composant Symfony |
| `symfony/clock` | `v7.4.8` | composant Symfony |
| `symfony/config` | `v7.4.14` | composant Symfony |
| `symfony/console` | `v7.4.14` | composant Symfony |
| `symfony/dependency-injection` | `v7.4.14` | composant Symfony |
| `symfony/deprecation-contracts` | `v3.7.1` | composant Symfony |
| `symfony/doctrine-bridge` | `v7.4.14` | composant Symfony |
| `symfony/dotenv` | `v7.4.14` | composant Symfony |
| `symfony/error-handler` | `v7.4.14` | composant Symfony |
| `symfony/event-dispatcher` | `v7.4.14` | composant Symfony |
| `symfony/event-dispatcher-contracts` | `v3.7.1` | composant Symfony |
| `symfony/expression-language` | `v7.4.14` | composant Symfony |
| `symfony/filesystem` | `v7.4.11` | composant Symfony |
| `symfony/finder` | `v7.4.14` | composant Symfony |
| `symfony/flex` | `v2.11.0` | composant Symfony |
| `symfony/framework-bundle` | `v7.4.14` | socle Symfony |
| `symfony/http-foundation` | `v7.4.14` | composant Symfony |
| `symfony/http-kernel` | `v7.4.14` | composant Symfony |
| `symfony/mime` | `v7.4.18` | composant Symfony |
| `symfony/maker-bundle` | `v1.67.0` | génération de code en développement |
| `symfony/password-hasher` | `v7.4.8` | composant Symfony |
| `symfony/polyfill-intl-grapheme` | `v1.38.1` | composant Symfony |
| `symfony/polyfill-intl-idn` | `v1.42.0` | composant Symfony |
| `symfony/polyfill-intl-normalizer` | `v1.38.0` | composant Symfony |
| `symfony/polyfill-mbstring` | `v1.38.2` | composant Symfony |
| `symfony/polyfill-php83` | `v1.38.2` | composant Symfony |
| `symfony/polyfill-php84` | `v1.38.1` | composant Symfony |
| `symfony/polyfill-php85` | `v1.38.1` | composant Symfony |
| `symfony/polyfill-uuid` | `v1.37.0` | composant Symfony |
| `symfony/property-access` | `v7.4.8` | composant Symfony |
| `symfony/property-info` | `v7.4.8` | composant Symfony |
| `symfony/routing` | `v7.4.13` | composant Symfony |
| `symfony/runtime` | `v7.4.14` | composant Symfony |
| `symfony/security-bundle` | `v7.4.14` | composant Symfony |
| `symfony/security-core` | `v7.4.14` | composant Symfony |
| `symfony/security-csrf` | `v7.4.8` | composant Symfony |
| `symfony/security-http` | `v7.4.14` | composant Symfony |
| `symfony/serializer` | `v7.4.14` | composant Symfony |
| `symfony/service-contracts` | `v3.7.1` | composant Symfony |
| `symfony/stopwatch` | `v7.4.8` | composant Symfony |
| `symfony/string` | `v7.4.13` | composant Symfony |
| `symfony/translation-contracts` | `v3.7.1` | composant Symfony |
| `symfony/twig-bridge` | `v7.4.14` | composant Symfony |
| `symfony/twig-bundle` | `v7.4.14` | composant Symfony |
| `symfony/type-info` | `v7.4.9` | composant Symfony |
| `symfony/uid` | `v7.4.9` | composant Symfony |
| `symfony/validator` | `v7.4.14` | composant Symfony |
| `symfony/var-dumper` | `v7.4.14` | composant Symfony |
| `symfony/var-exporter` | `v7.4.14` | composant Symfony |
| `symfony/web-link` | `v7.4.8` | composant Symfony |
| `symfony/yaml` | `v7.4.14` | composant Symfony |
| `phpunit/phpunit` | `11.5.56` | tests |
