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

| Command | Description |
|--------|-------------|
| `bunary init [name] [--auth basic\|jwt] [--umbrella]` | Create a new Bunary project |
| `bunary model:make <table>` | Generate ORM model in `src/models/` |
| `bunary make:middleware <name>` | Generate middleware in `src/middleware/` |
| `bunary make:migration <name>` | Create migration in `./migrations/` |
| `bunary migrate` | Run pending migrations |
| `bunary migrate:rollback` | Rollback last migration batch |
| `bunary migrate:status` | Show migration status |
| `bunary route:make <name>` | Generate route module in `src/routes/` |
| `bunary --help`, `bunary --version` | Help and version |

### `bunary init [name] [--auth basic|jwt] [--umbrella]`

Create a new Bunary project, optionally with Basic or JWT auth scaffolding.

```bash
# Create a new project in a directory
bunary init my-app

# Scaffold with Basic Auth (env: BASIC_AUTH_USER, BASIC_AUTH_PASSWORD)
bunary init my-app --auth basic

# Scaffold with JWT (env: JWT_SECRET)
bunary init my-app --auth jwt

# Create a project in the current directory
bunary init .
```

This creates a new Bunary project with:
- `package.json` - Pre-configured with Bunary dependencies (includes `@bunary/auth` when `--auth` is used)
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

## Generated Files (examples)

These examples match what the CLI generates. With `init --umbrella`, imports use `bunary/http` and `bunary/core` instead of `@bunary/http` and `@bunary/core`.

### package.json (default)

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
    "@bunary/core": "^0.0.5",
    "@bunary/http": "^0.0.4"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.3"
  }
}
```

With `--umbrella`, `dependencies` is `{ "bunary": "^0.0.1" }` instead of `@bunary/core` and `@bunary/http`. With `--auth basic` or `--auth jwt`, `@bunary/auth` is added.

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

With `init --umbrella`, the import is `from "bunary/core"`.

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

With `init --umbrella`, the import is `from "bunary/http"`. With `--auth basic` or `--auth jwt`, the file also imports the middleware and calls `app.use(basicMiddleware)` or `app.use(jwtMiddleware)`.

### src/routes/

- **index.ts** — Imports and calls `registerMain`, `registerGroupExample` (and any `route:make` modules you add).
- **main.ts** — Registers `/` and `/health`.
- **groupExample.ts** — Registers `/api` group with `/api/health`.

Example `src/routes/main.ts`:

```typescript
import type { BunaryApp } from "@bunary/http";

export function registerMain(app: BunaryApp): void {
  app.get("/", () => ({ message: "Welcome to Bunary!", docs: "https://github.com/bunary-dev" }));
  app.get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }));
}
```

### make:migration output

Example `./migrations/20260129120000_create_users_table.ts`:

```typescript
import { Schema } from "@bunary/orm";

export async function up(): Promise<void> {
  Schema.createTable("users", (table) => {
    table.increments("id");
    table.text("name");
    table.timestamps();
  });
}

export async function down(): Promise<void> {
  Schema.dropTable("users");
}
```

### make:middleware output (generic)

Example `src/middleware/ensure-auth.ts`:

```typescript
import type { Middleware } from "@bunary/http";

export const ensureAuthMiddleware: Middleware = async (ctx, next) => {
  const response = await next();
  return response;
};
```

### route:make output

Example `src/routes/users.ts`:

```typescript
import type { BunaryApp } from "@bunary/http";

export function registerUsers(app: BunaryApp): void {
  // app.get("/users", () => ({ list: [] }));
}
```

Add `registerUsers` to `src/routes/index.ts` and call it from `registerRoutes`.

## Programmatic API

You can use init and project generators programmatically. All generator functions are async.

```typescript
import {
  init,
  generatePackageJson,
  generateConfig,
  generateEntrypoint,
  generateRoutesMain,
  generateRoutesIndex,
  generateRoutesGroupExample,
  generateMiddlewareContent,
  makeModel,
} from "@bunary/cli";
import type { InitOptions } from "@bunary/cli";

// Scaffold a full project
await init("my-app");
await init("my-app", { auth: "jwt" });
await init("my-app", { umbrella: true });

// Generate individual files (e.g. for custom tooling)
const packageJson = await generatePackageJson("my-app");
const packageJsonUmbrella = await generatePackageJson("my-app", { umbrella: true });
const config = await generateConfig("my-app", { umbrella: true });
const entrypoint = await generateEntrypoint({ auth: "basic" });
const routesMain = await generateRoutesMain({ umbrella: true });

// Model generator (must be run from a Bunary project directory)
await makeModel("user_profile");  // src/models/UserProfile.ts
```

**InitOptions:** `{ auth?: "basic" | "jwt"; umbrella?: boolean }` — pass to `init`, `generatePackageJson`, `generateConfig`, `generateEntrypoint`, and route generators (`generateRoutesMain`, `generateRoutesIndex`, `generateRoutesGroupExample`) to control auth scaffolding and umbrella package usage.

**Note:** `makeModel` and `generateMiddlewareContent` require a Bunary project context when writing files. Commands `make:middleware`, `make:migration`, `route:make`, and `migrate` are available via the CLI only.

## Requirements

- Bun >= 1.0.0

## License

MIT
