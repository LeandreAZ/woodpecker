# 🪵 Woodpecker Trainer

> A modern web application to practice the **Woodpecker Method** with interactive chess puzzles, progress tracking and advanced analytics.

---

# 📖 About

Woodpecker Trainer is a personal project built to experiment with modern web technologies while creating a complete application around the **Woodpecker Method**.

The application allows users to create multiple Woodpecker trainings, solve puzzles on an interactive chessboard, monitor their progress through successive cycles and analyze their performance over time.

Although initially developed for personal use, the application is designed with a scalable architecture and clean domain model.

---

# 🎯 Goals

## Functional goals

- Create and manage multiple Woodpecker trainings.
- Follow the official Woodpecker workflow.
- Solve puzzles directly on an interactive chessboard.
- Compare performances between cycles.
- Keep personal notes for every puzzle.
- Visualize progress through dashboards.
- Correlate Woodpecker training with Chess.com and Lichess ratings.

## Technical goals

This project is mainly built to learn and experiment with:

- Symfony
- API Platform
- React
- TypeScript
- PostgreSQL
- Docker
- Power BI
- Clean Architecture
- Domain Driven Design concepts
- REST APIs
- Authentication
- CSV imports
- Symfony Console Commands

---

# ✨ Main Features

## 👤 User Management

- Registration
- Login
- JWT Authentication
- User profile
- Archive account

### External chess accounts

Users can connect:

- Lichess
- Chess.com

The application stores rating history in order to compare rating evolution with Woodpecker trainings.

---

# 🪵 Woodpecker Trainings

A user can create as many trainings as desired.

Examples:

- Woodpecker Book
- Lichess Fork Collection
- My Tournament Mistakes
- Mates in Two

Each training contains:

- a fixed puzzle collection
- multiple cycles
- planning configuration
- personal notes
- statistics
- dashboard

Once the first cycle starts, the puzzle list becomes immutable.

---

# ♟ Puzzle Sources

A training can be created from:

- Lichess puzzle database
- Manual puzzle creation
- CSV import

Manual puzzles may contain a FEN position but it is optional.

---

# ♟ Interactive Puzzle Solving

Each puzzle can be solved directly inside the application using an interactive chessboard.

For every attempt the application stores:

- solving time
- success/failure
- number of mistakes
- played moves
- timestamps

Multiple attempts are allowed.

Only the **first attempt** is used for the official Woodpecker statistics.

Additional attempts remain available for advanced analytics.

After solving a puzzle, users may:

- replay the solution
- browse the expected line
- analyze the position with Stockfish (future feature)

---

# 🔄 Woodpecker Cycles

Each training contains multiple cycles.

Every cycle reuses **exactly the same puzzle collection**.

The objective is to complete every new cycle in less time than the previous one.

The application manages:

- cycle progression
- completion percentage
- remaining puzzles
- target duration
- daily objectives

Users can customize objectives before starting a cycle or modify them later if necessary.

---

# 📝 Personal Notes

Each puzzle can have a personal note.

Notes belong to the puzzle **inside a specific training**.

Therefore:

- notes are shared across all cycles of the same training
- the same puzzle used in another training has different notes

---

# 📊 Dashboard

The dashboard provides insights such as:

- completed puzzles
- completion percentage
- average solving time
- first-attempt success rate
- cycle comparison
- daily activity
- streaks
- weakest tactical themes
- strongest tactical themes

---

# 📈 Rating Evolution

When connected to Lichess and/or Chess.com, users can visualize:

- Rapid rating
- Blitz rating
- Bullet rating
- Classical rating

Woodpecker trainings are displayed on the timeline in order to observe possible correlations between training periods and rating progression.

---

# 📥 CSV Import

Puzzle collections can be imported from CSV files.

The import system is intentionally designed as a dedicated module to experiment with:

- Symfony Console Commands
- Validation
- Background processing
- Import reports

---

# 🗄 Archive

Trainings are archived instead of permanently deleted.

Archived trainings preserve:

- cycles
- attempts
- notes
- statistics

This allows users to keep historical data while hiding inactive trainings.

---

# 📐 Domain Model Status

The current UML and MCD diagrams are **provisional design documents**. They describe the intended domain and may contain incorrect or overly strict cardinalities. They must not be treated as an exact database schema or as the sole source of truth during code generation.

Until the domain has been implemented and validated, use the following rules:

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

The CSV import section of the current diagram is intentionally incomplete and will be refined when that module is implemented.

Implementation decisions, automated tests and database constraints take precedence when they clarify or correct the provisional diagrams. A new UML diagram and MCD will be generated at the end of the implementation so that they reflect the final domain model.

---

# 🛠 Technical Stack

## Backend

- PHP 8+
- Symfony
- API Platform
- Doctrine ORM
- PostgreSQL
- JWT Authentication

## Frontend

- React
- TypeScript
- React Router
- React Query
- react-chessboard
- chess.js

## Infrastructure

- Docker
- Docker Compose

## Analytics

- Power BI
- CSV Export

---

# 🧪 Symfony Experiments

This project is also a playground to explore the Symfony ecosystem.

Topics include:

- Custom Console Commands
- CSV Import
- Doctrine Migrations
- Fixtures
- Services
- DTOs
- API Platform Filters
- Event Listeners
- Event Subscribers
- Messenger
- Validation
- Serialization Groups
- Testing
- Docker workflows

---

# 🚀 Roadmap

## Version 1

- Authentication
- Woodpecker trainings
- Interactive chessboard
- Cycles
- Attempts
- Personal notes
- Dashboard

## Version 2

- CSV import
- Training planner
- Lichess integration
- Chess.com integration
- Rating graphs

## Version 3

- Stockfish analysis
- Power BI reports
- Advanced statistics
- Public/shared trainings
- PWA support

---

# 📄 License

This project is an educational and personal project created to learn modern web development while building a complete chess training platform around the Woodpecker Method.
