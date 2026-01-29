/**
 * route:make command tests
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeRoute } from "../../src/commands/route/makeRoute.js";

describe("route:make command", () => {
	let testDir: string;
	let originalCwd: string;

	beforeEach(async () => {
		originalCwd = process.cwd();
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-make-route-test-"));
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
		await mkdir(join(testDir, "src", "routes"), { recursive: true });
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

	it("should create route file in src/routes directory", async () => {
		await makeRoute("users");

		const routePath = join(testDir, "src", "routes", "users.ts");
		expect(existsSync(routePath)).toBe(true);
	});

	it("should generate with correct function name", async () => {
		await makeRoute("users");

		const routePath = join(testDir, "src", "routes", "users.ts");
		const content = readFileSync(routePath, "utf-8");
		expect(content).toContain("export function registerUsers");
		expect(content).toContain("BunaryApp");
	});

	it("should convert kebab-case route name to register function name", async () => {
		await makeRoute("user-profile");

		const routePath = join(testDir, "src", "routes", "user-profile.ts");
		expect(existsSync(routePath)).toBe(true);
		const content = readFileSync(routePath, "utf-8");
		expect(content).toContain("registerUserProfile");
	});

	it("should not overwrite existing route file", async () => {
		await makeRoute("users");

		await expect(makeRoute("users")).rejects.toThrow("already exists");
	});

	it("should throw error if not in a Bunary project", async () => {
		await rm(join(testDir, "package.json"));

		await expect(makeRoute("users")).rejects.toThrow("Not in a Bunary project");
	});

	it("should create src/routes directory if it does not exist", async () => {
		await rm(join(testDir, "src", "routes"), { recursive: true, force: true });

		await makeRoute("users");

		expect(existsSync(join(testDir, "src", "routes", "users.ts"))).toBe(true);
	});
});
