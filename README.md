<p align="center">
  <img src="https://bunary.dev/bunary-orange-black.svg" alt="Bunary" width="100" />
</p>

# @bunary/cli

Command-line interface for the Bunary framework. Project scaffolding and developer tools (init, model:make, middleware:make, migration:make, route:make, migrate). Full reference: [docs/index.md](./docs/index.md).

## Installation

```bash
bun add -g @bunary/cli
```

Or use directly with `bunx`:

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

With Basic or JWT auth scaffolding: `bunary init my-app --auth basic` or `--auth jwt`. For all commands, options, generated file examples, and the programmatic API, see [docs/index.md](./docs/index.md).

## Requirements

- Bun ≥ 1.0.0

## License

MIT
