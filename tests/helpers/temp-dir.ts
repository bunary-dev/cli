/**
 * Temp dirs for tests. Every dir created here is tracked and removed by the
 * global afterEach/afterAll in tests/setup.ts, which Bun runs even when a test
 * or its beforeEach fails, so /tmp doesn't accumulate.
 *
 * Prefixes must start with "bunary-cli-" so bunfig.toml's
 * coveragePathIgnorePatterns keeps generated projects out of coverage.
 */
import { mkdtempSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PREFIX = "bunary-cli-";
const created = new Set<string>();

function checkPrefix(prefix: string): void {
	if (!prefix.startsWith(PREFIX)) {
		throw new Error(`Temp dir prefix must start with "${PREFIX}": ${prefix}`);
	}
}

export async function makeTempDir(
	prefix = "bunary-cli-test-",
): Promise<string> {
	checkPrefix(prefix);
	const dir = await mkdtemp(join(tmpdir(), prefix));
	created.add(dir);
	return dir;
}

export function makeTempDirSync(prefix = "bunary-cli-test-"): string {
	checkPrefix(prefix);
	const dir = mkdtempSync(join(tmpdir(), prefix));
	created.add(dir);
	return dir;
}

/** Remove every tracked temp dir. Safe to call repeatedly. */
export async function removeTempDirs(): Promise<void> {
	const dirs = [...created];
	created.clear();
	await Promise.all(
		dirs.map((dir) => rm(dir, { recursive: true, force: true })),
	);
}
