<p align="center">
  <img src="https://bunary.dev/bunary-orange-black.svg" alt="Bunary" width="100" />
</p>

# @bunary/cli

Command-line interface for the Bunary framework: project scaffolding (`init`), `make:*` generators (`make:route`, `make:middleware`, `make:command`, `make:provider`) and a runner for your app's own commands and for commands contributed by installed `@bunary/*` packages. Migrations are delegated to [drizzle-kit](https://orm.drizzle.team/docs/kit-overview). Full reference: [docs/index.md](./docs/index.md).

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

Run `bunary init` with no name (or with `-i`) in a terminal to be prompted for the name and auth type. With Basic or JWT auth scaffolding: `bunary init my-app --auth basic` or `--auth jwt`. `init` refuses to overwrite existing files (use `--force` to override), and every scaffolding command accepts `--dry-run`. For all commands, options, and generated file examples, see [docs/index.md](./docs/index.md).

## Database

The CLI ships no migration commands. With `@bunary/orm` installed, it contributes `make:model` and the `db:*` commands (thin wrappers over drizzle-kit), which then appear in `bunary --help`. Without it, use drizzle-kit directly: `bunx drizzle-kit generate`, `bunx drizzle-kit migrate`, `bunx drizzle-kit studio`.

## Declaring flags in project commands

Flags in a `CommandFlag` definition that accept a value must set `takesValue: true` (or list `values`). A flag with neither is a boolean switch: it never consumes the next argument, and `--flag=value` is rejected with an error.

## Requirements

- Bun ≥ 1.4.0

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
