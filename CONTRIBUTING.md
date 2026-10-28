# Contributing

## Running checks

```bash
bun install
bun test
bun run lint
bun run typecheck
```

## Temp dirs in tests

Tests that need a scratch directory must create it with the helper in
`tests/helpers/temp-dir.ts`, never with `mkdtemp`/`mkdtempSync` directly:

```ts
import { makeTempDir } from "../helpers/temp-dir.js";

let testDir: string;

beforeEach(async () => {
	testDir = await makeTempDir("bunary-cli-my-feature-test-");
});
```

Every dir the helper creates is removed by the global `afterEach`/`afterAll`
in `tests/setup.ts`, which `bunfig.toml` preloads for every test file. Bun runs
those hooks even when a test or its `beforeEach` fails, so you don't need your
own `rm` cleanup and /tmp doesn't accumulate.

- Prefixes must start with `bunary-cli-` so `coveragePathIgnorePatterns` keeps
  generated projects out of the coverage report. The helper throws otherwise.
- If a test calls `process.chdir()`, restore the original cwd in your own
  `afterEach`.
- `tests/temp-dir.test.ts` fails if any test file calls `mkdtemp` directly.
