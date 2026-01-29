# @bunary/cli

Command-line interface for the Bunary framework. Provides project scaffolding and development tools.

## Documentation

Canonical documentation for this package lives in [`docs/index.md`](./docs/index.md).

## Installation

```bash
bun add -g @bunary/cli
```

Or use directly with `bunx`:

```bash
bunx @bunary/cli init my-app
```

## Commands

### `bunary init [name] [--auth basic|jwt] [--umbrella]`

Create a new Bunary project, optionally with Basic or JWT auth scaffolding, or using the umbrella `bunary` package.

```bash
# Create a new project in a directory
bunary init my-app

# Scaffold with Basic Auth (env: BASIC_AUTH_USER, BASIC_AUTH_PASSWORD)
bunary init my-app --auth basic

# Scaffold with JWT (env: JWT_SECRET)
bunary init my-app --auth jwt

# Use umbrella package (bunary instead of @bunary/core + @bunary/http)
bunary init my-app --umbrella

# Create a project in the current directory
bunary init .
```

This creates a new Bunary project with:
- `package.json` - Pre-configured with Bunary dependencies (`@bunary/core` + `@bunary/http` by default; single `bunary` when `--umbrella`; includes `@bunary/auth` when `--auth` is used)
- `bunary.config.ts` - Application configuration
- `src/index.ts` - Entry point that registers routes via `src/routes/` (and `app.use(authMiddleware)` when `--auth` is used)
- `src/routes/` - Route modules: `main.ts`, `groupExample.ts`, `index.ts`
- `src/middleware/basic.ts` or `src/middleware/jwt.ts` - Auth middleware (only when `--auth basic` or `--auth jwt`; same as `make:middleware basic` / `make:middleware jwt`)

**Generated Project Structure (with `--auth jwt`):**
```
my-app/
├── package.json
├── bunary.config.ts
└── src/
    ├── index.ts
    ├── middleware/
    │   └── jwt.ts    # Same as bunary make:middleware jwt
    └── routes/
        ├── index.ts
        ├── main.ts
        └── groupExample.ts
```

`init --auth basic` or `init --auth jwt` is a shortcut: it creates the same `src/middleware/basic.ts` or `src/middleware/jwt.ts` as running `bunary make:middleware basic` or `bunary make:middleware jwt` after init.

**Next Steps:**
```bash
cd my-app
bun install
bun run dev
```

### `bunary model:make <table-name>`

Generate an ORM model file for a database table.

```bash
# Generate a model for a table
bunary model:make users
bunary model:make user_profile  # Creates UserProfile.ts

# The command automatically:
# - Converts table names to PascalCase (user_profile → UserProfile)
# - Creates files in src/models/ directory
# - Validates you're in a Bunary project
# - Prevents overwriting existing files
```

**Requirements:**
- Must be run from within a Bunary project directory
- Project must have `@bunary/core` in `package.json` dependencies

**Generated Model Structure:**
```
src/models/
└── Users.ts  # Generated from "users" table name
```

### `bunary make:middleware <name>`

Generate a middleware file in `src/middleware/` (Laravel-inspired).

```bash
# Generate a generic middleware
bunary make:middleware ensure-auth   # Creates src/middleware/ensure-auth.ts with ensureAuthMiddleware
bunary make:middleware log-request   # Creates src/middleware/log-request.ts with logRequestMiddleware

# Auth middleware (same stubs as init --auth basic|jwt)
bunary make:middleware basic         # Creates src/middleware/basic.ts with basicMiddleware (@bunary/auth Basic guard)
bunary make:middleware jwt           # Creates src/middleware/jwt.ts with jwtMiddleware (@bunary/auth JWT guard)

# The command automatically:
# - Creates the file in src/middleware/ directory
# - For basic/jwt uses auth stubs; for other names uses the generic (ctx, next) stub
# - Validates you're in a Bunary project
# - Prevents overwriting existing files
```

**Requirements:**
- Must be run from within a Bunary project directory
- Project must have `@bunary/core` in `package.json` dependencies

**Generated Middleware Structure:**
```
src/middleware/
└── ensure-auth.ts  # Exports ensureAuthMiddleware (Middleware type from @bunary/http)
```

### `bunary make:migration <name>`

Create a migration file in `./migrations/` (Laravel-inspired). Requires `@bunary/orm`.

```bash
# Create a migration (Laravel-style naming)
bunary make:migration create_users_table   # Creates ./migrations/<timestamp>_create_users_table.ts
bunary make:migration add_slug_to_posts    # Suggested table name "posts" in stub

# The command automatically:
# - Creates the file in ./migrations/ with timestamp prefix (YYYYMMDDHHmmss_name.ts)
# - Generates up() and down() using Schema from @bunary/orm
# - Derives table name from migration name (e.g. create_users_table → "users")
# - Requires @bunary/orm in dependencies
```

**Generated migration structure:**
```
migrations/
└── 20260129120000_create_users_table.ts  # export async function up() / down() with Schema
```

### `bunary migrate`, `bunary migrate:rollback`, `bunary migrate:status`

Run migrations (Laravel-inspired). Uses `@bunary/orm` migrator; migrations live in `./migrations/`.

```bash
bunary migrate           # Run pending migrations (up)
bunary migrate:rollback  # Rollback last batch (down)
bunary migrate:status    # Show ran / pending migrations
```

On first run, the CLI creates `scripts/migrate.ts` in your project. Ensure `src/config/orm.ts` exists and calls `setOrmConfig(defineOrmConfig({ database: { ... } }))` so the migrator can connect.

### `bunary route:make <name>`

Generate a route module in `src/routes/`.

```bash
# Generate a route module
bunary route:make users       # Creates src/routes/users.ts with registerUsers(app)
bunary route:make user-profile  # Creates src/routes/user-profile.ts with registerUserProfile(app)

# The command automatically:
# - Creates the file in src/routes/ directory
# - Generates a register function (e.g. registerUsers) for the route name
# - Validates you're in a Bunary project
# - Prevents overwriting existing files
```

**Requirements:**
- Must be run from within a Bunary project directory
- Project must have `@bunary/core` in `package.json` dependencies

**Generated Route Structure:**
```
src/routes/
└── users.ts  # Exports registerUsers(app); add it to src/routes/index.ts manually
```

### Options

```bash
bunary --help     # Show help
bunary --version  # Show version
```

## Generated Files

### package.json

```json
{
  "name": "my-app",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "start": "bun run src/index.ts",
    "build": "bun build ./src/index.ts --outdir ./dist --target bun"
  },
  "dependencies": {
    "@bunary/core": "^0.0.2",
    "@bunary/http": "^0.0.2"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.3"
  }
}
```

### bunary.config.ts

```typescript
import { defineConfig } from "@bunary/core";

export default defineConfig({
  app: {
    name: "my-app",
    env: "development",
    debug: true,
  },
});
```

### src/index.ts

The entrypoint creates the app and registers routes from `src/routes/`:

```typescript
import { createApp } from "@bunary/http";
import { registerRoutes } from "./routes/index.js";

const app = createApp();
registerRoutes(app);

const server = app.listen({ port: 3000 });
console.log(`🚀 Server running at http://localhost:${server.port}`);
```

### src/routes/

- **index.ts** — Calls all route registration functions.
- **main.ts** — Registers base routes: `/` and `/health`.
- **groupExample.ts** — Example route group: `/api` with `/api/health`.

## Programmatic API

You can also use the CLI functions programmatically:

```typescript
import {
  init,
  generatePackageJson,
  generateConfig,
  generateEntrypoint
} from "@bunary/cli";

// Generate files (all generator functions are async)
const packageJson = await generatePackageJson("my-app");
const config = await generateConfig("my-app");
const entrypoint = await generateEntrypoint();

// Or scaffold a full project
await init("my-app");
```

### Model Generation

```typescript
import { makeModel } from "@bunary/cli";

// Generate a model file
await makeModel("user_profile");  // Creates src/models/UserProfile.ts
```

**Note:** 
- Generator functions (`generatePackageJson`, `generateConfig`, `generateEntrypoint`) are async and must be awaited
- `makeModel` requires being in a Bunary project directory

## Requirements

- Bun >= 1.0.0

## License

MIT
