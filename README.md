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

With Basic or JWT auth scaffolding: `bunary init my-app --auth basic` or `--auth jwt`. `init` refuses to overwrite existing files (use `--force` to override). For all commands, options, and generated file examples, see [docs/index.md](./docs/index.md).

## Declaring flags in project commands

Flags in a `CommandFlag` definition that accept a value must set `takesValue: true` (or list `values`). A flag with neither is a boolean switch: it never consumes the next argument, and `--flag=value` is rejected with an error.

## Requirements

- Bun ≥ 1.4.0

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
