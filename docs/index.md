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

| Command | Description |
|--------|-------------|
| `bunary init [name] [--auth basic\|jwt] [--force] [-i]` | Create a new Bunary project |
| `bunary make:route <name>` | Generate route module in `src/routes/` |
| `bunary make:middleware <name>` | Generate middleware in `src/middleware/` |
| `bunary make:command <name> [--name <cli-name>]` | Generate an app command in `src/commands/` |
| `bunary make:provider <name>` | Generate a service provider in `src/providers/` |
| `bunary <command> --help` | Help for one command |
| `bunary --help`, `bunary --version` | Help and version |

Commands contributed by installed packages (e.g. `make:model` and `db:*` from `@bunary/orm`) and your app's own commands are listed by `bunary --help` too; see [Package commands](#package-commands) and [Custom Project Commands](#custom-project-commands).

Flags accept `--key value` and `--key=value`; a bare `--` ends flag parsing. Flags declaring a short `alias` also accept it (e.g. `-p 4000`).

### bunary init [name] [--auth basic|jwt] [--force] [--interactive]

Creates a new Bunary project. You can pass a directory name or `.` for the current directory. With `--auth basic` or `--auth jwt` you get auth middleware stubs (same as running `make:middleware basic` or `jwt` after init).

```bash
bunary init my-app
bunary init my-app --auth jwt
bunary init .
```

Run `bunary init` with no name in a terminal and it walks you through the setup instead: it asks for the project name, shows the target directory, and lets you pick the auth scaffolding with the arrow keys (or by typing its number). Pass `--interactive` (`-i`) to get the prompts even when you give a name; anything given upfront becomes the default. Without a TTY (CI, piped stdin) or with `--no-interactive`, `init` never prompts and fails if the name is missing, so scripts keep working unchanged.

`init` aborts without writing anything if any file it would create already exists; pass `--force` to overwrite.

All scaffolding commands (`init` and every `make:*`) accept `--dry-run` to print the files that would be created without writing anything (exit code 0); add `--verbose` to also print file contents. The flag may come before the command: `bunary --dry-run init my-app`.

The command creates `package.json`, `config/bunary.ts`, `src/index.ts`, and `src/routes/` (main, groupExample, index). If you used `--auth`, it also creates `src/middleware/basic.ts` or `jwt.ts` and wires it in the entrypoint. Next steps: `cd <name>`, `bun install`, `bun run dev`.

### Generators (make:*)

Every generator must run inside a Bunary project (`package.json` with `@bunary/core`), writes `<name>.ts` into its directory, and never overwrites an existing file.

Names must start with a letter and contain only letters, digits, `_` and `-`: no path separators, dots or whitespace. The target path is also checked against the project root after resolving symlinks, so a `src/routes` symlink pointing outside the project is refused rather than followed.

#### bunary make:route \<name\>

Generates a route module in `src/routes/` with a register function (e.g. `registerUsers(app)`). You then add that function to `src/routes/index.ts` and call it from `registerRoutes`.

#### bunary make:middleware \<name\>

Generates a middleware file in `src/middleware/`. For names `basic` or `jwt` it uses the auth stubs (Basic or JWT guard); for other names it uses a generic `(ctx, next)` stub.

#### bunary make:command \<name\> [--name \<cli-name\>]

Generates `src/commands/<name>.ts` exporting e.g. `sendEmailsCommand`, typed with the `Command` interface from `@bunary/core`. The CLI name defaults to the file name; `--name mail:send` sets another. Register it in `config/bunary.ts` (see [Custom Project Commands](#custom-project-commands)).

#### bunary make:provider \<name\>

Generates `src/providers/<name>.ts` exporting e.g. `cacheProvider`, built with `defineProvider` from `@bunary/core` (a `register` hook for bindings and an async `boot` hook). Add it to `createApp({ providers: [...] })`.

## Database and migrations

The CLI does not run migrations. Bunary's ORM builds on Drizzle, so migrations belong to [drizzle-kit](https://orm.drizzle.team/docs/kit-overview):

- With `@bunary/orm` installed, it contributes `make:model` and the `db:*` commands (`db:generate`, `db:migrate`, `db:studio`) as [package commands](#package-commands). They are thin pass-throughs to drizzle-kit.
- Without it, use drizzle-kit directly: `bunx drizzle-kit generate`, `bunx drizzle-kit migrate`, `bunx drizzle-kit studio`.

The migration runner, the migration generator and the built-in model generator from 0.x are gone; running one of their old names prints where to go instead. The 0.x `<thing>:make` generators are now `make:<thing>`.

## Package commands

A direct `@bunary/*` dependency of your project can contribute CLI commands. The package declares a module in its `package.json`:

```json
{
  "name": "@bunary/orm",
  "bunary": { "commands": "./dist/cli.js" }
}
```

The module exports a `commands` array (or a default-exported array) of `Command` objects from `@bunary/core`, so the package never depends on the CLI:

```typescript
import type { Command } from "@bunary/core";

export const commands: Command[] = [
  {
    name: "db:migrate",
    description: "Apply pending migrations (drizzle-kit migrate)",
    usage: "bunary db:migrate",
    category: "database",
    run: async () => { /* ... */ },
  },
];
```

At startup the CLI reads your `package.json` (`dependencies` and `devDependencies`), finds each installed `@bunary/*` package that declares `bunary.commands`, and registers its commands. Commands of packages that are not installed, not direct dependencies, or outside the `@bunary` scope are never loaded, and do not appear in `--help` or in "Did you mean?" suggestions.

- A package whose commands collide with a built-in or with another package's commands is ignored with a warning; the built-ins keep working.
- A package whose module fails to load, or points outside the package, is skipped with a warning.
- If `category` is omitted it defaults to the package name.

## Generated files (examples)

What init and the generators produce.

**package.json (default):** dependencies include `@bunary/core` and `@bunary/http`. With `--auth basic` or `--auth jwt`, `@bunary/auth` is added.

**config/bunary.ts:** Uses `defineConfig` from `@bunary/core`. Sets app name, env, debug.

**src/index.ts:** Creates the app with `createApp`, calls `registerRoutes(app)`, then `app.listen({ port: 3000 })`. With auth, it also imports the middleware and calls `app.use(basicMiddleware)` or `app.use(jwtMiddleware)`.

**src/routes/main.ts:** Registers `/` and `/health`. groupExample registers `/api` and `/api/health`. You add `make:route` modules in `src/routes/index.ts`.

**make:middleware output (generic):** A single export, e.g. `ensureAuthMiddleware`, of type `Middleware` from `@bunary/http`, with `(ctx, next)` and `return next()`.

**make:route output:** A file that exports e.g. `registerUsers(app: BunaryApp)`; you wire it in `src/routes/index.ts`.

**make:command output:** A `Command` object (`name`, `description`, `usage`, `category`, `run`) exported as e.g. `sendEmailsCommand`.

**make:provider output:** A `defineProvider({ name, register, boot })` export, e.g. `cacheProvider`.

`make:command` and `make:provider` output use the `Command` and `defineProvider` exports of `@bunary/core` 1.0.

## Running the CLI from code

The `bunary` executable is a thin wrapper; importing the package has no side effects. It exports `run(argv)`, which runs a command and resolves to the exit code, plus the `Command` types:

```typescript
import { run } from "@bunary/cli";

const code = await run(["make:route", "users", "--dry-run"]);
```

## Requirements

- Bun ≥ 1.4.0

## Custom Project Commands

You can add your own CLI commands to any Bunary project. The CLI picks them up automatically when you run `bunary` from that project directory.

### Where to put them

Create a `src/commands/` directory and export one command per file:

```
my-app/
  config/
    bunary.ts          ← register commands here
  src/
    commands/
      seed.ts          ← your custom command
      deploy.ts
    routes/
    index.ts
```

### Defining a command

Each command is a plain object implementing `Command` from `@bunary/core`, with `name`, `description`, and an async `run` function. `bunary make:command seed --name db:seed` generates one:

```typescript
// src/commands/seed.ts
import type { Command } from "@bunary/core";

export const seedCommand: Command = {
  name: "db:seed",
  description: "Seed the database with test data",
  usage: "bunary db:seed",
  category: "project",
  run: async () => {
    console.log("Seeding...");
    // your logic here
  },
};
```

### Registering commands in config

Add a `commands` array to your config file. The CLI looks for `config/bunary.ts` first, then falls back to `bunary.config.ts`:

```typescript
// config/bunary.ts
import { defineConfig } from "@bunary/core";
import { seedCommand } from "../src/commands/seed.js";
import { deployCommand } from "../src/commands/deploy.js";

export default defineConfig({
  app: { name: "my-app" },
  commands: [seedCommand, deployCommand],
});
```

Now `bunary db:seed` and `bunary deploy` work from your project root. They also show up under a "Project" section in `bunary --help`.

### Rules

- Project commands can't override built-in commands (`init`, `make:route`, etc.) or commands contributed by packages. The CLI exits with an error naming both sides if there's a name collision.
- Commands missing `name`, `description`, or `run` are skipped with a warning.
- If `category` is omitted it defaults to `"project"`.
- Flag names may be written core-style (`"force"`, alias `"f"`) or CLI-style (`"--force"`, alias `"-f"`).


### Declaring flags in project commands

Flags that accept a value must set `takesValue: true` (or list `values`) in their `CommandFlag` definition. A flag declaring neither is a boolean switch: it never consumes the next argument, and `--flag=value` is rejected with an error.

```ts
flags: [
  { name: "--out", description: "Output directory", takesValue: true },
  { name: "--force", description: "Overwrite files" },
],
```
