# @bunary/cli

Command-line interface for the Bunary framework. Provides project scaffolding and developer tooling.

## Installation

```bash
bun add -g @bunary/cli
```

Or use directly with `bunx`:

```bash
bunx @bunary/cli --help
```

## Commands (high level)

- `bunary init [name] [--auth basic|jwt]` — Create a new Bunary project (optionally with Basic or JWT auth scaffolding)
- `bunary model:make <table-name>` — Generate an ORM model file
- `bunary make:middleware <name>` — Generate a middleware in src/middleware/ (Laravel-inspired)
- `bunary make:migration <name>` — Create a migration in ./migrations/ (Laravel-inspired)
- `bunary migrate`, `bunary migrate:rollback`, `bunary migrate:status` — Run migrations
- `bunary route:make <name>` — Generate a route module in src/routes/

See the README for the full command reference.

## Requirements

- Bun ≥ 1.0.0

