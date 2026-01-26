# @bunary/cli

Command-line interface for the Bunary framework. Provides project scaffolding and development tools.

## Installation

```bash
bun add -g @bunary/cli
```

Or use directly with `bunx`:

```bash
bunx @bunary/cli init my-app
```

## Commands

### `bunary init [name]`

Create a new Bunary project.

```bash
# Create a new project in a directory
bunary init my-app

# Create a project in the current directory
bunary init .
```

This creates a new Bunary project with:
- `package.json` - Pre-configured with Bunary dependencies
- `bunary.config.ts` - Application configuration
- `src/index.ts` - Entry point with a working server

**Generated Project Structure:**
```
my-app/
├── package.json
├── bunary.config.ts
└── src/
    └── index.ts
```

**Next Steps:**
```bash
cd my-app
bun install
bun run dev
```

### `bunary make:model <table-name>`

Generate an ORM model file for a database table.

```bash
# Generate a model for a table
bunary make:model users
bunary make:model user_profile  # Creates UserProfile.ts

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

```typescript
import { createApp } from "@bunary/http";

const app = createApp();

app.get("/", () => ({
  message: "Welcome to Bunary!",
  docs: "https://github.com/bunary-dev",
}));

app.get("/health", () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

const server = app.listen(3000);
console.log(`🚀 Server running at http://localhost:${server.port}`);
```

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
import { makeModel } from "@bunary/cli/commands/model";

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
