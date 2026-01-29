# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
