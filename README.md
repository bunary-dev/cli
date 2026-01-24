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
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --target=bun --outdir=dist",
    "start": "bun run dist/index.js"
  },
  "dependencies": {
    "@bunary/core": "^0.0.2",
    "@bunary/http": "^0.0.2"
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
  },
});
```

### src/index.ts

```typescript
import { createApp, Router, Response } from "@bunary/http";

const router = new Router();

router.get("/", () => {
  return Response.json({ message: "Welcome to Bunary!" });
});

const app = createApp({ router });

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
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

// Generate files
const packageJson = generatePackageJson("my-app");
const config = generateConfig("my-app");
const entrypoint = generateEntrypoint();

// Or scaffold a full project
await init("my-app");
```

## Requirements

- Bun >= 1.0.0

## License

MIT
