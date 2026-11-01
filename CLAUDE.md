# @bunary/cli — agent instructions

## Definition of done

A PR that changes anything a user of the CLI can observe (commands, flags,
help text, generated files, stubs, exit codes, error messages) is not done
until, in the same PR:

- `docs/index.md` documents the change: new commands, flags and generated
  output get a section or an updated example; removed or changed behaviour is
  corrected wherever the docs mention it.
- `README.md` is updated if it covers the changed area (installation, quick
  start, command list).
- `CHANGELOG.md` has an entry under `## [Unreleased]` (Breaking / Added /
  Changed / Fixed), ending with the issue number, e.g. `(#125)`.

Internal-only changes (tests, refactors with no observable effect, CI) need a
CHANGELOG entry only if they fix a user-visible bug.

### Version bump

Every PR that changes `src/`, `stubs/` or anything else shipped in the package
bumps `package.json` `version` in the same PR. Without it, `Tag release on
main` fails after merge on a duplicate tag (the tag for the unchanged version
already exists), even though CI and tests are green.

- Pick the bump by semver: patch for fixes, minor for features. Before 1.0
  (`0.y.z`), breaking changes bump the minor too; from 1.0 on they bump the
  major.
- On a pre-release, bump the pre-release number instead: `1.0.0-rc.N` →
  `1.0.0-rc.N+1` (e.g. `1.0.0-rc.2` → `1.0.0-rc.3`).
- Move the PR's CHANGELOG entries from `## [Unreleased]` to a new
  `## [x.y.z] - YYYY-MM-DD` heading for that version, leaving `[Unreleased]`
  empty above it.

Docs-only, test-only and CI-only changes do not bump the version.

## Stubs

Templates live in `stubs/**/*.ts.stub` and are embedded via
`src/utils/stubRegistry.ts`. A new stub needs an entry there.

## Out of scope

No npm publishing and no CI/CD or release workflows: publishing for all
`@bunary/*` packages is on hold until the maintainer says otherwise.
