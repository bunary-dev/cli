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

See the README for the full command reference until the CLI docs are expanded.

## Requirements

- Bun ≥ 1.0.0

