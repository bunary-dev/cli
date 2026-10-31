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

## Stubs

Templates live in `stubs/**/*.ts.stub` and are embedded via
`src/utils/stubRegistry.ts`. A new stub needs an entry there.

## Out of scope

No npm publishing and no CI/CD or release workflows: publishing for all
`@bunary/*` packages is on hold until the maintainer says otherwise.
