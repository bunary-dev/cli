# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
