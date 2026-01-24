import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	generateConfig,
	generateEntrypoint,
	generatePackageJson,
	init,
} from "../../src/commands/init.js";

const TEST_DIR = join(tmpdir(), "bunary-cli-test");

describe("init command", () => {
	beforeEach(async () => {
		// Clean up test directory before each test
		if (existsSync(TEST_DIR)) {
			await rm(TEST_DIR, { recursive: true, force: true });
		}
		await mkdir(TEST_DIR, { recursive: true });
	});

	afterEach(async () => {
		// Clean up test directory after each test
		if (existsSync(TEST_DIR)) {
			await rm(TEST_DIR, { recursive: true, force: true });
		}
	});

	describe("init()", () => {
		test("creates project directory with name", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app");

			expect(existsSync(projectDir)).toBe(true);
		});

		test("creates package.json in project directory", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app");

			expect(existsSync(join(projectDir, "package.json"))).toBe(true);
		});

		test("creates bunary.config.ts in project directory", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app");

			expect(existsSync(join(projectDir, "bunary.config.ts"))).toBe(true);
		});

		test("creates src/index.ts in project directory", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app");

			expect(existsSync(join(projectDir, "src", "index.ts"))).toBe(true);
		});

		test("works with '.' for current directory", async () => {
			const projectDir = join(TEST_DIR, "current-dir-test");
			await mkdir(projectDir, { recursive: true });
			process.chdir(projectDir);
			await init(".");

			expect(existsSync(join(projectDir, "package.json"))).toBe(true);
			expect(existsSync(join(projectDir, "bunary.config.ts"))).toBe(true);
			expect(existsSync(join(projectDir, "src", "index.ts"))).toBe(true);
		});
	});

	describe("generatePackageJson()", () => {
		test("returns valid JSON", () => {
			const json = generatePackageJson("test-app");
			expect(() => JSON.parse(json)).not.toThrow();
		});

		test("includes project name", () => {
			const json = generatePackageJson("my-awesome-app");
			const parsed = JSON.parse(json);
			expect(parsed.name).toBe("my-awesome-app");
		});

		test("includes @bunary/core dependency", () => {
			const json = generatePackageJson("test-app");
			const parsed = JSON.parse(json);
			expect(parsed.dependencies["@bunary/core"]).toBeDefined();
		});

		test("includes @bunary/http dependency", () => {
			const json = generatePackageJson("test-app");
			const parsed = JSON.parse(json);
			expect(parsed.dependencies["@bunary/http"]).toBeDefined();
		});

		test("includes dev script", () => {
			const json = generatePackageJson("test-app");
			const parsed = JSON.parse(json);
			expect(parsed.scripts.dev).toBeDefined();
		});
	});

	describe("generateConfig()", () => {
		test("returns valid TypeScript", () => {
			const config = generateConfig("test-app");
			expect(config).toContain("import");
			expect(config).toContain("defineConfig");
		});

		test("includes app name", () => {
			const config = generateConfig("my-app");
			expect(config).toContain("my-app");
		});

		test("includes development environment", () => {
			const config = generateConfig("test-app");
			expect(config).toContain("development");
		});
	});

	describe("generateEntrypoint()", () => {
		test("returns valid TypeScript", () => {
			const entry = generateEntrypoint();
			expect(entry).toContain("import");
			expect(entry).toContain("createApp");
		});

		test("includes a GET route", () => {
			const entry = generateEntrypoint();
			expect(entry).toContain(".get(");
		});

		test("includes app.listen()", () => {
			const entry = generateEntrypoint();
			expect(entry).toContain(".listen(");
		});

		test("includes port 3000", () => {
			const entry = generateEntrypoint();
			expect(entry).toContain("3000");
		});
	});
});
