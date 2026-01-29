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

		test("with auth basic: adds @bunary/auth, src/middleware/basic.ts (same as middleware:make basic), and app.use(basicMiddleware)", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app", { auth: "basic" });

			const pkg = JSON.parse(
				await Bun.file(join(projectDir, "package.json")).text(),
			);
			expect(pkg.dependencies["@bunary/auth"]).toBeDefined();

			expect(
				existsSync(join(projectDir, "src", "middleware", "basic.ts")),
			).toBe(true);
			const authContent = await Bun.file(
				join(projectDir, "src", "middleware", "basic.ts"),
			).text();
			expect(authContent).toContain("createAuth");
			expect(authContent).toContain("createBasicGuard");
			expect(authContent).toContain("basicMiddleware");

			const entryContent = await Bun.file(
				join(projectDir, "src", "index.ts"),
			).text();
			expect(entryContent).toContain("basicMiddleware");
			expect(entryContent).toContain("app.use(basicMiddleware)");
			expect(entryContent).toContain("./middleware/basic.js");
		});

		test("with auth jwt: adds @bunary/auth, src/middleware/jwt.ts (same as middleware:make jwt), and app.use(jwtMiddleware)", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app", { auth: "jwt" });

			const pkg = JSON.parse(
				await Bun.file(join(projectDir, "package.json")).text(),
			);
			expect(pkg.dependencies["@bunary/auth"]).toBeDefined();

			expect(existsSync(join(projectDir, "src", "middleware", "jwt.ts"))).toBe(
				true,
			);
			const authContent = await Bun.file(
				join(projectDir, "src", "middleware", "jwt.ts"),
			).text();
			expect(authContent).toContain("createAuth");
			expect(authContent).toContain("createJwtGuard");
			expect(authContent).toContain("jwtMiddleware");

			const entryContent = await Bun.file(
				join(projectDir, "src", "index.ts"),
			).text();
			expect(entryContent).toContain("jwtMiddleware");
			expect(entryContent).toContain("app.use(jwtMiddleware)");
			expect(entryContent).toContain("./middleware/jwt.js");
		});

		test("without auth: no @bunary/auth, no src/middleware/basic.ts or jwt.ts, no auth middleware in entrypoint", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app");

			const pkg = JSON.parse(
				await Bun.file(join(projectDir, "package.json")).text(),
			);
			expect(pkg.dependencies["@bunary/auth"]).toBeUndefined();
			expect(
				existsSync(join(projectDir, "src", "middleware", "basic.ts")),
			).toBe(false);
			expect(existsSync(join(projectDir, "src", "middleware", "jwt.ts"))).toBe(
				false,
			);

			const entryContent = await Bun.file(
				join(projectDir, "src", "index.ts"),
			).text();
			expect(entryContent).not.toContain("basicMiddleware");
			expect(entryContent).not.toContain("jwtMiddleware");
			expect(entryContent).not.toContain("app.use(basicMiddleware)");
			expect(entryContent).not.toContain("app.use(jwtMiddleware)");
		});

		test("package.json has @bunary/core and @bunary/http, imports use @bunary/*", async () => {
			const projectDir = join(TEST_DIR, "my-app");
			process.chdir(TEST_DIR);
			await init("my-app");

			const pkg = JSON.parse(
				await Bun.file(join(projectDir, "package.json")).text(),
			);
			expect(pkg.dependencies["@bunary/core"]).toBeDefined();
			expect(pkg.dependencies["@bunary/http"]).toBeDefined();

			const entryContent = await Bun.file(
				join(projectDir, "src", "index.ts"),
			).text();
			expect(entryContent).toContain('from "@bunary/http"');
			const configContent = await Bun.file(
				join(projectDir, "bunary.config.ts"),
			).text();
			expect(configContent).toContain('from "@bunary/core"');
			const mainContent = await Bun.file(
				join(projectDir, "src", "routes", "main.ts"),
			).text();
			expect(mainContent).toContain('from "@bunary/http"');
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

		test("includes @bunary/auth when auth option is basic", async () => {
			const json = await generatePackageJson("test-app", { auth: "basic" });
			const parsed = JSON.parse(json);
			expect(parsed.dependencies["@bunary/auth"]).toBeDefined();
		});

		test("includes @bunary/auth when auth option is jwt", async () => {
			const json = await generatePackageJson("test-app", { auth: "jwt" });
			const parsed = JSON.parse(json);
			expect(parsed.dependencies["@bunary/auth"]).toBeDefined();
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

		test("uses @bunary/core", async () => {
			const config = await generateConfig("test-app");
			expect(config).toContain('from "@bunary/core"');
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

		test("with auth basic includes basicMiddleware and app.use(basicMiddleware)", async () => {
			const entry = await generateEntrypoint({ auth: "basic" });
			expect(entry).toContain("basicMiddleware");
			expect(entry).toContain("app.use(basicMiddleware)");
			expect(entry).toContain("./middleware/basic.js");
		});

		test("with auth jwt includes jwtMiddleware and app.use(jwtMiddleware)", async () => {
			const entry = await generateEntrypoint({ auth: "jwt" });
			expect(entry).toContain("jwtMiddleware");
			expect(entry).toContain("app.use(jwtMiddleware)");
			expect(entry).toContain("./middleware/jwt.js");
		});

		test("without auth option does not include auth middleware", async () => {
			const entry = await generateEntrypoint();
			expect(entry).not.toContain("basicMiddleware");
			expect(entry).not.toContain("jwtMiddleware");
		});

		test("uses @bunary/http", async () => {
			const entry = await generateEntrypoint();
			expect(entry).toContain('from "@bunary/http"');
		});
	});
});
