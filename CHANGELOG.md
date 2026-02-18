# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2026-02-19

### Added

- **Show file tree summary after `bunary init`** (Closes #59)
  - `bunary init` now displays an ASCII tree of all created files
  - File count shown at the bottom (e.g. "6 files created")
  - Tree uses colored output: dim connectors, green filenames, cyan directories
  - Works without colors when `NO_COLOR` is set
  - Tree updates correctly when `--auth` adds middleware files (7 files)
  - New `buildFileTree()` utility in `src/utils/fileTree.ts` with 13 unit tests

## [0.1.4] - 2026-02-18

### Changed

- **Harden flag parsing infrastructure**
  - Extract `parseFlags()` and `validateFlags()` into `src/utils/parseFlags.ts` with full test coverage (27 tests)
  - Support boolean flags (`--dry-run`) — flags at end of args or followed by another flag are set to `true`
  - Update `Command.run()` signature from `Record<string, string>` to `Record<string, string | boolean>`
  - Detect and throw on duplicate flags (`--auth basic --auth jwt` → `Duplicate flag: --auth`)
  - Validate flag names and values against command definitions at dispatch level (fail fast before execution)
  - Auto-generate help Options section from command flag definitions (no hardcoded `globalOptions` to maintain)
  - Extract `ensureBunaryProject()` and `ensureOrmDependency()` guards into `src/utils/validation.ts`
  - Replace 5 duplicated `isBunaryProject` + throw blocks and 2 duplicated `hasOrm` checks with single-line guard calls
  - 6 new validation guard tests (180 total tests passing)

## [0.1.3] - 2026-02-18

### Changed

- **Refactor to command registry pattern** (Closes #62)
  - `src/types/command.ts` — `Command`, `CommandArg`, `CommandFlag`, `CommandCategory` interfaces
  - `src/registry.ts` — central registry with `commands`, `findCommand()`, `getCommandNames()`
  - Each command module exports a `command` definition alongside its implementation
  - `index.ts` dispatches via registry lookup instead of 170-line `if/else` chain
  - Help output auto-generates from registry (no separate command list to maintain)
  - `suggest.ts` pulls command names from registry instead of hardcoded list
  - Adding a new command = create file + add one import to the registry
  - 15 new registry tests, all 147 tests passing
  - No behavior changes from the user's perspective

## [0.1.2] - 2026-02-18

### Added

- **"Did you mean?" suggestions for unknown commands** (Closes #58)
  - `src/utils/suggest.ts` — Levenshtein distance algorithm and command suggestion logic
  - Typos within 2 edits suggest the correct command (e.g. `iinit` → `init`)
  - Prefix matches suggest when unambiguous (e.g. `ini` → `init`)
  - No suggestion shown when nothing is close enough
  - Unknown commands no longer dump full help — show suggestion + `--help` hint
  - 25 unit tests covering distance calculation, prefix matching, and edge cases

## [0.1.1] - 2026-02-18

### Added

- **Color output and visual hierarchy** (Closes #56)
  - `src/utils/color.ts` — zero-dependency ANSI helpers (`bold`, `dim`, `red`, `green`, `yellow`, `cyan`)
  - Respects `NO_COLOR` env var and non-TTY pipes (clean text when piped to file)
  - Help output grouped into Scaffold / Database / Options sections with aligned columns
  - Success messages (`✅ Created ...`) in green with paths in cyan
  - Error messages in red, usage hints in dim
  - Init next-steps block with bold header and cyan commands
  - Unknown command no longer dumps full help — shows short hint instead
  - Tests for color module covering TTY, `NO_COLOR`, and non-TTY scenarios

## [0.1.0] - 2026-01-31

### Added

- First minor release — API stable for development use until 1.0.0

### Changed

- Bumped `@bunary/core` dependency to ^0.1.0

## [0.0.13] - 2026-01-29

### Removed

- **`bunary init --umbrella`** (Closes #41) — Removed umbrella option. Init always uses `@bunary/core` and `@bunary/http`. The umbrella `bunary` package will live in its own repo.

## [0.0.12] - 2026-01-29

### Added

- **`bunary init --umbrella`** (Closes #18)
  - Scaffolds project with umbrella `bunary` package instead of individual `@bunary/core` and `@bunary/http`
  - `package.json` gets dependency `bunary`; generated imports use `bunary/http` and `bunary/core`
  - Without `--umbrella`, behavior unchanged (default remains `@bunary/*` deps)

## [0.0.11] - 2026-01-29

### Added

- **Migration commands** (Closes #13)
  - `bunary migration:make <name>` — Create a migration in `./migrations/` with timestamp prefix (Laravel-style)
  - `bunary migrate` — Run pending migrations (up)
  - `bunary migrate:rollback` — Rollback last batch (down)
  - `bunary migrate:status` — Show ran / pending migrations
  - Migrations use Schema from `@bunary/orm`; requires `@bunary/orm` in project
  - First migrate run creates `scripts/migrate.ts`; project needs `src/config/orm.ts` that calls `setOrmConfig`

## [0.0.10] - 2026-01-29

### Added

- **`bunary middleware:make <name>`** (Laravel-inspired)
  - Generates a middleware file in `src/middleware/<name>.ts` with a camelCase export (e.g. ensure-auth → ensureAuthMiddleware)
  - Requires Bunary project; documented in help and README

### Changed

- **Auth scaffolding** uses the same code path as `middleware:make`: auth stubs moved to `stubs/middleware/auth-basic.ts` and `auth-jwt.ts`; `init --auth basic|jwt` creates `src/middleware/basic.ts` or `jwt.ts` (same content as `bunary middleware:make basic|jwt`). Entrypoint imports `basicMiddleware`/`jwtMiddleware` from `./middleware/basic.js` or `./middleware/jwt.js`. Removed duplicate `project/auth.ts` and `stubs/project/auth-*.ts`.

## [0.0.9] - 2026-01-29

### Added

- **`bunary init --auth basic|jwt`** (Closes #17)
  - Scaffolds auth middleware: adds `@bunary/auth`, `src/middleware/auth.ts`, and `app.use(authMiddleware)` in entrypoint
  - `--auth basic`: Basic Auth guard with env-based verify (BASIC_AUTH_USER, BASIC_AUTH_PASSWORD)
  - `--auth jwt`: JWT guard with JWT_SECRET from env; documented in CLI help and README

## [0.0.8] - 2026-01-29

### Changed

- **Init template aligned with @bunary/http API** (Closes #16)
  - Entrypoint stub uses `app.listen({ port: 3000 })` instead of `app.listen(3000)`
  - Comment added for `createApp({ basePath })` option; reworded to avoid asserting current support, with commented example

## [0.0.7] - 2026-01-29

### Added

- **`bunary route:make <name>`** (Closes #15)
  - Generates a route module in `src/routes/<name>.ts` with a register function
  - Stub uses placeholders `{{routeName}}` and `{{functionName}}` (e.g. users → registerUsers)
  - Command documented in CLI help and README
  - Requires Bunary project (package.json with @bunary/core)

## [0.0.6] - 2026-01-29

### Added

- **`bunary init` scaffolds `src/routes/`** (Closes #14)
  - Creates `src/routes/main.ts` (registers `/` and `/health`)
  - Creates `src/routes/groupExample.ts` (example `/api` group with `/api/health`)
  - Creates `src/routes/index.ts` (aggregates route registration)
  - `src/index.ts` now imports and calls `registerRoutes(app)` instead of defining routes inline

## [0.0.5] - 2026-01-26

### Changed

- Renamed `make:model` command to `model:make` (following object:task pattern)
  - Updated all documentation and help text
  - Command now follows Laravel-style naming convention

### Fixed

- Fixed stub path resolution to work correctly with bundled code
  - Stubs now resolve correctly in both development and production builds
  - Handles bundled `index.js` file structure properly
  - Fixes issue where `bunary init` failed with "stub file not found" error

## [0.0.4] - 2026-01-26

### Changed

- Refactored template system to use stub files with placeholder syntax
  - Templates moved from inline strings to `stubs/` directory
  - Placeholder syntax: `{{key}}` for dynamic content replacement
  - Generator functions (`generatePackageJson`, `generateConfig`, `generateEntrypoint`, `generateModel`) are now async
- Build process now copies stubs to `dist/` directory for production builds
- Stubs directory excluded from linting

### Internal

- Created `loadStub()` utility function for loading and processing stub files
- Organized stubs by category: `stubs/model/` and `stubs/project/`
- Removed old `templates/` directory in favor of stub-based system

## [0.0.3] - 2026-01-26

### Added

- `bunary make:model <table-name>` command for ORM model scaffolding
  - Validates current directory is a Bunary project (requires @bunary/core in package.json)
  - Converts table names to PascalCase model names (user_profile → UserProfile)
  - Creates model files in `src/models/` directory
  - Prevents overwriting existing model files
  - Uses template-based generation (no @bunary/orm dependency required)
- Utility functions:
  - `isBunaryProject()` - Validates Bunary project structure
  - `tableNameToModelName()` - Converts table names to model class names
- Model template generator with JSDoc examples
- Comprehensive test suite (10 tests for make:model command)

## [0.0.2] - 2026-01-26

### Changed

- Updated `@bunary/core` dependency to `^0.0.5`

## [0.0.1] - 2025-01-20

### Added

- `bunary init [name]` command for project scaffolding
- `--help` flag for displaying usage information
- `--version` flag for displaying CLI version
- Project template generation:
  - `package.json` with Bunary dependencies
  - `bunary.config.ts` with `defineConfig`
  - `src/index.ts` with working server example
- Support for `.` to initialize in current directory
- Programmatic API for template generation:
  - `init(name)` - Full project scaffolding
  - `generatePackageJson(name)` - Package.json template
  - `generateConfig(name)` - Configuration file template
  - `generateEntrypoint()` - Entry point template
- Comprehensive test suite (17 tests)
