/**
 * 0.4.0 baseline (#134): every `@bunary/*` package moves to 0.4.0 together.
 * Runs the real `bunary` binary so the versions a fresh project gets, and the
 * types its generated files are written against, are the published ones.
 */
import { describe, expect, test } from "bun:test";
import { symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeTempDir } from "./helpers/temp-dir.js";

const root = join(import.meta.dir, "..");
const bin = join(root, "src", "bin.ts");
const BASELINE = "^0.4.0";
/** http is ahead of the baseline: 0.7.1 ships route model binding (#144). */
const HTTP = "^0.7.1";

async function spawn(cmd: string[], cwd: string) {
	const proc = Bun.spawn(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
	const [stdout, stderr, code] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { stdout, stderr, code };
}

/** Run `bunary init app ...flags` in a temp dir; returns the project dir. */
async function initProject(...flags: string[]): Promise<string> {
	const cwd = await makeTempDir("bunary-cli-baseline-");
	const res = await spawn(
		["bun", bin, "init", "app", "--no-interactive", ...flags],
		cwd,
	);
	expect(res.stderr).toBe("");
	expect(res.code).toBe(0);
	return join(cwd, "app");
}

function bunaryDeps(pkg: {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}): Record<string, string> {
	const all = { ...pkg.dependencies, ...pkg.devDependencies };
	return Object.fromEntries(
		Object.entries(all).filter(([name]) => name.startsWith("@bunary/")),
	);
}

describe("0.4.0 baseline", () => {
	test("package.json is 0.4.x and depends on @bunary/core ^0.4.0", async () => {
		const pkg = await Bun.file(join(root, "package.json")).json();
		expect(pkg.version).toMatch(/^0\.4\.\d+$/);
		expect(bunaryDeps(pkg)).toEqual({ "@bunary/core": BASELINE });
	});

	test("bunary init pins @bunary/http ^0.7.1 and every other @bunary/* dependency to ^0.4.0", async () => {
		const app = await initProject();
		const pkg = await Bun.file(join(app, "package.json")).json();
		expect(bunaryDeps(pkg)).toEqual({
			"@bunary/core": BASELINE,
			"@bunary/http": HTTP,
		});
	});

	for (const auth of ["basic", "jwt"]) {
		test(`bunary init --auth ${auth} pins @bunary/http ^0.7.1 and every other @bunary/* dependency to ^0.4.0`, async () => {
			const app = await initProject("--auth", auth);
			const pkg = await Bun.file(join(app, "package.json")).json();
			expect(bunaryDeps(pkg)).toEqual({
				"@bunary/core": BASELINE,
				"@bunary/http": HTTP,
				"@bunary/auth": BASELINE,
			});
		});
	}

	test("make:command and make:provider output typechecks against @bunary/core 0.4.0", async () => {
		const core = await Bun.file(
			join(root, "node_modules", "@bunary", "core", "package.json"),
		).json();
		expect(core.version).toMatch(/^0\.4\./);

		const app = await initProject();
		for (const args of [
			["make:command", "send-emails"],
			["make:provider", "cache"],
		]) {
			const res = await spawn(["bun", bin, ...args], app);
			expect(res.code).toBe(0);
		}

		// Reuse this repo's installed core, @types/bun and typescript.
		await symlink(join(root, "node_modules"), join(app, "node_modules"));
		await writeFile(
			join(app, "tsconfig.json"),
			JSON.stringify({
				compilerOptions: {
					lib: ["ESNext"],
					target: "ESNext",
					module: "Preserve",
					moduleResolution: "bundler",
					types: ["bun"],
					strict: true,
					skipLibCheck: true,
					noEmit: true,
				},
				files: ["src/commands/send-emails.ts", "src/providers/cache.ts"],
			}),
		);
		const tsc = join(root, "node_modules", ".bin", "tsc");
		const res = await spawn(["bun", tsc, "-p", "tsconfig.json"], app);
		expect(res.stdout + res.stderr).toBe("");
		expect(res.code).toBe(0);
	}, 60_000);
});

describe("docs point at 0.4.0", () => {
	for (const file of ["README.md", "docs/index.md"]) {
		test(`${file} installs @bunary/cli@^0.4.0 and names no stale version`, async () => {
			const text = await Bun.file(join(root, file)).text();
			expect(text).toContain("bun add @bunary/cli@^0.4.0");
			expect(text).not.toContain("1.0.0-rc");
			expect(text).not.toMatch(/@bunary\/[a-z]+@\^?0\.[0-3]\./);
			expect(text).not.toMatch(/`@bunary\/[a-z]+` (1\.0|0\.[0-3])/);
		});
	}
});
