/**
 * middleware:make command tests
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeMiddleware } from "../../src/commands/middleware/makeMiddleware.js";

describe("middleware:make command", () => {
	let testDir: string;
	let originalCwd: string;

	beforeEach(async () => {
		originalCwd = process.cwd();
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-make-middleware-test-"));
		process.chdir(testDir);

		const packageJson = {
			name: "test-project",
			dependencies: {
				"@bunary/core": "^0.0.5",
			},
		};
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);
		await mkdir(join(testDir, "src", "middleware"), { recursive: true });
	});

	afterEach(async () => {
		try {
			if (originalCwd && existsSync(originalCwd)) {
				process.chdir(originalCwd);
			}
		} catch {
			// ignore
		}
		if (testDir) {
			try {
				await rm(testDir, { recursive: true, force: true });
			} catch {
				// ignore
			}
		}
	});

	it("should create middleware file in src/middleware directory", async () => {
		await makeMiddleware("ensure-auth");

		const middlewarePath = join(testDir, "src", "middleware", "ensure-auth.ts");
		expect(existsSync(middlewarePath)).toBe(true);
	});

	it("should generate with correct function name", async () => {
		await makeMiddleware("ensure-auth");

		const content = readFileSync(
			join(testDir, "src", "middleware", "ensure-auth.ts"),
			"utf-8",
		);
		expect(content).toContain("ensureAuthMiddleware");
		expect(content).toContain("Middleware");
	});

	it("should convert kebab-case middleware name to camelCase function name", async () => {
		await makeMiddleware("log-request");

		const content = readFileSync(
			join(testDir, "src", "middleware", "log-request.ts"),
			"utf-8",
		);
		expect(content).toContain("logRequestMiddleware");
	});

	it("should not overwrite existing middleware file", async () => {
		await makeMiddleware("ensure-auth");
		await expect(makeMiddleware("ensure-auth")).rejects.toThrow(
			/already exists/,
		);
	});

	it("should throw error if not in a Bunary project", async () => {
		process.chdir(tmpdir());
		await expect(makeMiddleware("ensure-auth")).rejects.toThrow(
			"Not in a Bunary project",
		);
	});

	it("should create src/middleware directory if it does not exist", async () => {
		const emptyDir = join(testDir, "empty");
		await mkdir(emptyDir, { recursive: true });
		await writeFile(
			join(emptyDir, "package.json"),
			JSON.stringify(
				{
					name: "p",
					dependencies: { "@bunary/core": "^0.0.5" },
				},
				null,
				2,
			),
		);
		process.chdir(emptyDir);

		await makeMiddleware("ensure-auth");

		expect(
			existsSync(join(emptyDir, "src", "middleware", "ensure-auth.ts")),
		).toBe(true);
	});

	it("should generate middleware with Middleware type from @bunary/http", async () => {
		await makeMiddleware("ensure-auth");

		const content = readFileSync(
			join(testDir, "src", "middleware", "ensure-auth.ts"),
			"utf-8",
		);
		expect(content).toContain("@bunary/http");
		expect(content).toContain("Middleware");
		expect(content).toContain("ctx");
		expect(content).toContain("next");
	});

	it("middleware:make basic creates auth stub (same as init --auth basic)", async () => {
		await makeMiddleware("basic");

		const content = readFileSync(
			join(testDir, "src", "middleware", "basic.ts"),
			"utf-8",
		);
		expect(content).toContain("basicMiddleware");
		expect(content).toContain("createAuth");
		expect(content).toContain("createBasicGuard");
	});

	it("middleware:make jwt creates auth stub (same as init --auth jwt)", async () => {
		await makeMiddleware("jwt");

		const content = readFileSync(
			join(testDir, "src", "middleware", "jwt.ts"),
			"utf-8",
		);
		expect(content).toContain("jwtMiddleware");
		expect(content).toContain("createAuth");
		expect(content).toContain("createJwtGuard");
	});
});
