# Woodpecker Trainer

Woodpecker Trainer is a personal chess training application based on the Woodpecker Method.
The goal is to solve a fixed puzzle set over repeated cycles, measure progress, and later compare training periods with rating evolution from Lichess or Chess.com.

The project is also a learning project around a modern full-stack architecture: Symfony, API Platform, React, TypeScript, PostgreSQL and Docker.

## Current Status

The repository currently contains the backend and frontend foundation:

- Docker Compose environment with Nginx, PHP-FPM and PostgreSQL.
- Symfony 7.4 LTS backend in `backend/`.
- API Platform installed and available on `/api`.
- Doctrine ORM and Doctrine Migrations configured.
- MakerBundle installed for development code generation.
- React, TypeScript and Vite frontend in `frontend/`.

Important project decisions, known issues and setup notes are documented in `docs/PROJECT_NOTES.md`.

## Run The Project

Start the containers:

```bash
docker compose up -d --wait
```

Open the API:

```text
http://localhost:8080/api
```

Open the frontend:

```text
http://localhost:5173
```

Run a Symfony command:

```bash
docker compose exec php php bin/console about
```

Run an npm command:

```bash
docker compose exec frontend npm run lint
```

Stop the containers:

```bash
docker compose down
```

Reset the database volume only when you intentionally want to delete local database data:

```bash
docker compose down -v
```

## Docker Notes

This project uses Docker so the local machine does not need to manage PHP extensions, PostgreSQL, Nginx or Composer versions manually.

On Windows with WSL2, Docker should ideally have at least 3-4 GB of memory for comfortable Symfony/API Platform work. With around 2 GB, the project can run, but first requests and Composer installs may be slow. If `/api` times out right after startup, run:

```bash
docker compose exec php php bin/console cache:warmup
```

Then reload `http://localhost:8080/api`.

## Architecture

The repository follows a common full-stack monorepo layout:

```text
woodpecker/
  backend/          Symfony API application
  docker/           Docker service configuration
  compose.yaml      Local development services
  docs/             Project decisions and notes
  frontend/         React TypeScript application
```

The backend follows the standard Symfony directory structure. We avoid a heavy custom architecture at the start and keep the code close to Symfony and API Platform conventions. Domain-specific organization will be introduced progressively when entities and use cases become clearer.

Expected backend direction:

- `src/Entity` for Doctrine entities.
- `src/Repository` for Doctrine repositories.
- `src/ApiResource` or API Platform metadata where useful.
- `src/Service` for application services when logic does not belong in an entity.
- `src/Command` for imports, maintenance tasks and experiments.
- `migrations/` for database migrations.

## Functional Goals

- Create and manage several Woodpecker trainings.
- Keep a fixed puzzle list per training after the first cycle starts.
- Solve puzzles on an interactive chessboard.
- Track attempts, mistakes, solving time and success rate.
- Compare cycles and progress over time.
- Add personal notes to puzzles inside a training.
- Import puzzle collections from CSV.
- Connect Lichess and Chess.com accounts later for rating history.
- Provide dashboards and exports for analysis.

## Provisional Domain Model

The current UML/MCD diagrams are provisional design documents. They may contain incorrect cardinalities, missing constraints or details that will change during implementation.

Until the domain has been implemented and validated, use these rules:

- A user may own `0..N` Woodpecker trainings; each training belongs to exactly one user.
- A draft training may contain `0..N` puzzles and `0..N` cycles.
- Each cycle belongs to exactly one training.
- A cycle puzzle may have `0..N` attempts because it may not have been attempted yet.
- Each attempt belongs to exactly one cycle puzzle and exactly one training session.
- A training session may contain `0..N` attempts, including a newly created or planned session.
- A puzzle may be reused by multiple trainings through `TrainingPuzzle`.
- Notes and training-specific puzzle settings belong to `TrainingPuzzle`, not to the global `Puzzle` record.
- External identifiers should be unique within their platform or source, rather than globally.
- Passwords are stored only as hashes, and external-account tokens must be stored securely.
- Calculated counters and statistics must either be derived from attempts or updated transactionally to avoid inconsistent data.

The CSV import part is intentionally incomplete and will be refined when that module is implemented. Implementation decisions, tests and database constraints take precedence when they clarify or correct the provisional diagrams. A new UML diagram and MCD will be generated at the end so they reflect the final domain model.

## Planned Stack

Backend:

- PHP 8.4
- Symfony 7.4 LTS
- API Platform
- Doctrine ORM
- PostgreSQL
- JWT authentication later

Frontend:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- react-chessboard
- chess.js

Infrastructure:

- Docker
- Docker Compose
- Nginx
- Node.js container for frontend tooling

Analytics:

- CSV export
- Power BI later

## Roadmap

Version 1:

- Authentication
- Woodpecker trainings
- Interactive chessboard
- Cycles
- Attempts
- Personal notes
- Dashboard

Version 2:

- CSV import
- Training planner
- Lichess integration
- Chess.com integration
- Rating graphs

Version 3:

- Stockfish analysis
- Power BI reports
- Advanced statistics
- Public/shared trainings
- PWA support

## License

This is an educational and personal project created to learn modern web development while building a complete chess training platform around the Woodpecker Method.
