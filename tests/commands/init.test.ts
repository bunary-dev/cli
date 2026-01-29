import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	generateConfig,
	generateEntrypoint,
	generatePackageJson,
	init,
} from "../../src/commands/init.js";

let TEST_DIR: string;

describe("init command", () => {
	beforeEach(async () => {
		// Create a unique test directory for each test run
		TEST_DIR = await mkdtemp(join(tmpdir(), "bunary-cli-test-"));
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

		test("creates src/routes/ with index.ts, main.ts, groupExample.ts", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app");

			expect(existsSync(join(projectDir, "src", "routes", "index.ts"))).toBe(
				true,
			);
			expect(existsSync(join(projectDir, "src", "routes", "main.ts"))).toBe(
				true,
			);
			expect(
				existsSync(join(projectDir, "src", "routes", "groupExample.ts")),
			).toBe(true);
		});

		test("src/index.ts uses registerRoutes from routes module", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app");

			const entrypointPath = join(projectDir, "src", "index.ts");
			const content = await Bun.file(entrypointPath).text();
			expect(content).toContain("registerRoutes");
			expect(content).toContain("routes/index");
			expect(content).not.toContain('app.get("/",');
		});

		test("works with '.' for current directory", async () => {
			const projectDir = join(TEST_DIR, "current-dir-test");
			await mkdir(projectDir, { recursive: true });
			process.chdir(projectDir);
			await init(".");

			expect(existsSync(join(projectDir, "package.json"))).toBe(true);
			expect(existsSync(join(projectDir, "bunary.config.ts"))).toBe(true);
			expect(existsSync(join(projectDir, "src", "index.ts"))).toBe(true);
			expect(existsSync(join(projectDir, "src", "routes", "index.ts"))).toBe(
				true,
			);
		});
	});

	describe("generatePackageJson()", () => {
		test("returns valid JSON", async () => {
			const json = await generatePackageJson("test-app");
			expect(() => JSON.parse(json)).not.toThrow();
		});

		test("includes project name", async () => {
			const json = await generatePackageJson("my-awesome-app");
			const parsed = JSON.parse(json);
			expect(parsed.name).toBe("my-awesome-app");
		});

		test("includes @bunary/core dependency", async () => {
			const json = await generatePackageJson("test-app");
			const parsed = JSON.parse(json);
			expect(parsed.dependencies["@bunary/core"]).toBeDefined();
		});

		test("includes @bunary/http dependency", async () => {
			const json = await generatePackageJson("test-app");
			const parsed = JSON.parse(json);
			expect(parsed.dependencies["@bunary/http"]).toBeDefined();
		});

		test("includes dev script", async () => {
			const json = await generatePackageJson("test-app");
			const parsed = JSON.parse(json);
			expect(parsed.scripts.dev).toBeDefined();
		});
	});

	describe("generateConfig()", () => {
		test("returns valid TypeScript", async () => {
			const config = await generateConfig("test-app");
			expect(config).toContain("import");
			expect(config).toContain("defineConfig");
		});

		test("includes app name", async () => {
			const config = await generateConfig("my-app");
			expect(config).toContain("my-app");
		});

		test("includes development environment", async () => {
			const config = await generateConfig("test-app");
			expect(config).toContain("development");
		});
	});

	describe("generateEntrypoint()", () => {
		test("returns valid TypeScript", async () => {
			const entry = await generateEntrypoint();
			expect(entry).toContain("import");
			expect(entry).toContain("createApp");
		});

		test("includes registerRoutes from routes module", async () => {
			const entry = await generateEntrypoint();
			expect(entry).toContain("registerRoutes");
			expect(entry).toContain("routes/index");
		});

		test("includes app.listen()", async () => {
			const entry = await generateEntrypoint();
			expect(entry).toContain(".listen(");
		});

		test("includes port 3000", async () => {
			const entry = await generateEntrypoint();
			expect(entry).toContain("3000");
		});
	});
});
