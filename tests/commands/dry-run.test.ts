/**
 * --dry-run tests for scaffolding commands
 */
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { init } from "../../src/commands/init.js";
import { makeMiddleware } from "../../src/commands/middleware/makeMiddleware.js";
import { makeMigration } from "../../src/commands/migration/makeMigration.js";
import { makeModel } from "../../src/commands/model/makeModel.js";
import { makeRoute } from "../../src/commands/route/makeRoute.js";
import { parseFlags } from "../../src/utils/parseFlags.js";
import { makeTempDir } from "../helpers/temp-dir.js";

describe("--dry-run", () => {
	let testDir: string;
	let originalCwd: string;
	let output: string;
	let logSpy: ReturnType<typeof spyOn>;

	beforeEach(async () => {
		originalCwd = process.cwd();
		testDir = await makeTempDir("bunary-cli-dry-run-test-");
		process.chdir(testDir);
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "t",
				dependencies: { "@bunary/core": "^0.0.5", "@bunary/orm": "^0.0.1" },
			}),
		);
		await writeFile(join(testDir, "bunary.config.ts"), "export default {};");
		output = "";
		logSpy = spyOn(console, "log").mockImplementation((...a: unknown[]) => {
			output += `${a.join(" ")}\n`;
		});
	});

	afterEach(() => {
		logSpy.mockRestore();
		process.chdir(originalCwd);
	});

	it("init lists files and writes nothing", async () => {
		await init("my-app", { dryRun: true });
		expect(existsSync(join(testDir, "my-app"))).toBe(false);
		expect(output).toContain("Dry run");
		expect(output).toContain("my-app/package.json");
		expect(output).toContain("my-app/src/index.ts");
		expect(output).toContain("6 files (dry run)");
	});

	it("init --auth jwt includes the middleware file", async () => {
		await init("my-app", { dryRun: true, auth: "jwt" });
		expect(output).toContain("my-app/src/middleware/jwt.ts");
		expect(output).toContain("7 files (dry run)");
	});

	it("init dry run for '.' does not write", async () => {
		const before = await readdir(testDir);
		await init(".", { dryRun: true, force: true });
		expect(await readdir(testDir)).toEqual(before);
	});

	it("verbose shows file contents", async () => {
		await init("my-app", { dryRun: true, verbose: true });
		expect(output).toContain('"name": "my-app"');
	});

	it("route:make", async () => {
		await makeRoute("users", { dryRun: true });
		expect(existsSync(join(testDir, "src"))).toBe(false);
		expect(output).toContain("src/routes/users.ts");
		expect(output).toContain("1 file (dry run)");
	});

	it("middleware:make", async () => {
		await makeMiddleware("ensure-auth", { dryRun: true });
		expect(existsSync(join(testDir, "src"))).toBe(false);
		expect(output).toContain("src/middleware/ensure-auth.ts");
	});

	it("model:make", async () => {
		await makeModel("user_profile", { dryRun: true });
		expect(existsSync(join(testDir, "src"))).toBe(false);
		expect(output).toContain("src/models/UserProfile.ts");
	});

	it("migration:make", async () => {
		await makeMigration("create_users_table", { dryRun: true });
		expect(existsSync(join(testDir, "migrations"))).toBe(false);
		expect(output).toMatch(/migrations\/\d{14}_create_users_table\.ts/);
	});

	it("still rejects existing files", async () => {
		await mkdir(join(testDir, "src", "routes"), { recursive: true });
		await writeFile(join(testDir, "src", "routes", "users.ts"), "x");
		await expect(makeRoute("users", { dryRun: true })).rejects.toThrow(
			"already exists",
		);
	});

	it("parseFlags treats declared boolean flags as switches", () => {
		const [pos, flags] = parseFlags(
			["--dry-run", "my-app"],
			[{ name: "--dry-run", description: "d", boolean: true }],
		);
		expect(pos).toEqual(["my-app"]);
		expect(flags).toEqual({ "dry-run": true });
	});
});
