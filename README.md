# @bunary/cli

CLI for the Bunary framework. Scaffolds projects, generates models and routes, and runs migrations. Full reference lives in [docs/index.md](./docs/index.md); that file is the canonical package doc and is synced to the documentation repo.

## Installation

```bash
bun add -g @bunary/cli
```

Or run without installing:

```bash
bunx @bunary/cli init my-app
```

## Quick start

```bash
bunary init my-app
cd my-app
bun install
bun run dev
```

For all commands (init options, model:make, make:middleware, make:migration, migrate, route:make) and generated file examples, see [docs/index.md](./docs/index.md).

## Requirements

Bun ≥ 1.0.0.

## License

MIT
