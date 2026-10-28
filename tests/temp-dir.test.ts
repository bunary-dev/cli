/**
 * Temp dir hygiene: every temp dir a test creates must be removed, even when
 * the test (or its beforeEach) fails, so /tmp doesn't accumulate.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
	makeTempDir,
	makeTempDirSync,
	removeTempDirs,
} from "./helpers/temp-dir.js";

const root = join(import.meta.dir, "..");

async function runFixture(name: string) {
	const proc = Bun.spawn(
		[
			"bun",
			"test",
			"--preload",
			join(import.meta.dir, "setup.ts"),
			join(import.meta.dir, "fixtures", name),
		],
		{ cwd: join(import.meta.dir, "fixtures"), stdout: "pipe", stderr: "pipe" },
	);
	const [stdout, , code] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	const dirs = [...stdout.matchAll(/TEMP_DIR=(\S+)/g)].map(
		(m) => m[1] as string,
	);
	return { code, dirs };
}

describe("temp dir helper", () => {
	test("makeTempDir creates a bunary-cli- prefixed dir", async () => {
		const dir = await makeTempDir("bunary-cli-helper-test-");
		expect(existsSync(dir)).toBe(true);
		expect(dir).toContain("bunary-cli-helper-test-");
		await removeTempDirs();
		expect(existsSync(dir)).toBe(false);
	});

	test("makeTempDirSync dirs are removed too", async () => {
		const dir = makeTempDirSync();
		expect(existsSync(dir)).toBe(true);
		await removeTempDirs();
		expect(existsSync(dir)).toBe(false);
	});

	test("rejects prefixes outside the bunary-cli- namespace", async () => {
		await expect(makeTempDir("other-")).rejects.toThrow(/bunary-cli-/);
	});
});

describe("cleanup runs even when tests fail", () => {
	test("failing test body", async () => {
		const r = await runFixture("failing-test.fixture.ts");
		expect(r.code).not.toBe(0);
		expect(r.dirs.length).toBe(1);
		for (const dir of r.dirs) expect(existsSync(dir)).toBe(false);
	});

	test("throwing beforeEach after the dir was created", async () => {
		const r = await runFixture("failing-hook.fixture.ts");
		expect(r.code).not.toBe(0);
		expect(r.dirs.length).toBe(1);
		for (const dir of r.dirs) expect(existsSync(dir)).toBe(false);
	});
});

describe("tests create temp dirs only through the helper", () => {
	function walk(dir: string): string[] {
		return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
		);
	}

	test("no direct mkdtemp/mkdtempSync calls", () => {
		const offenders = walk(import.meta.dir)
			.filter((f) => f.endsWith(".ts"))
			.filter((f) => !f.endsWith(join("helpers", "temp-dir.ts")))
			.filter((f) => f !== join(import.meta.dir, "temp-dir.test.ts"))
			.filter((f) => /\bmkdtemp(Sync)?\s*\(/.test(readFileSync(f, "utf8")))
			.map((f) => relative(root, f));
		expect(offenders).toEqual([]);
	});

	test("the global cleanup hook is preloaded", () => {
		const bunfig = readFileSync(join(root, "bunfig.toml"), "utf8");
		expect(bunfig).toMatch(/preload\s*=\s*\[[^\]]*"\.\/tests\/setup\.ts"/);
	});
});
