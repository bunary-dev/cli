/**
 * Tests for project command loading from user config files.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadProjectCommands } from "../../src/utils/loadProjectCommands.js";

describe("loadProjectCommands", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-test-"));
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	test("returns empty array when not a Bunary project", async () => {
		const result = await loadProjectCommands(testDir);
		expect(result).toEqual([]);
	});

	test("returns empty array when no config file exists", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toEqual([]);
	});

	test("loads commands from config/bunary.ts", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default {
				app: { name: "test-app" },
				commands: [
					{
						name: "db:seed",
						description: "Seed the database",
						category: "project",
						run: async () => {},
					},
				],
			};`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("db:seed");
		expect(result[0].description).toBe("Seed the database");
		expect(result[0].category).toBe("project");
	});

	test("loads commands from bunary.config.ts as fallback", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await writeFile(
			join(testDir, "bunary.config.ts"),
			`export default {
				app: { name: "test-app" },
				commands: [
					{
						name: "deploy",
						description: "Deploy the application",
						category: "project",
						run: async () => {},
					},
				],
			};`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("deploy");
	});

	test("prefers config/bunary.ts over bunary.config.ts", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default {
				app: { name: "test-app" },
				commands: [
					{
						name: "from-config-dir",
						description: "From config dir",
						category: "project",
						run: async () => {},
					},
				],
			};`,
		);

		await writeFile(
			join(testDir, "bunary.config.ts"),
			`export default {
				app: { name: "test-app" },
				commands: [
					{
						name: "from-root",
						description: "From root",
						category: "project",
						run: async () => {},
					},
				],
			};`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("from-config-dir");
	});

	test("returns empty array when config has no commands key", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default { app: { name: "test-app" } };`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toEqual([]);
	});

	test("returns empty array when commands is empty array", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default { app: { name: "test-app" }, commands: [] };`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toEqual([]);
	});

	test("loads multiple commands from config", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default {
				app: { name: "test-app" },
				commands: [
					{
						name: "db:seed",
						description: "Seed the database",
						category: "project",
						run: async () => {},
					},
					{
						name: "deploy",
						description: "Deploy the application",
						category: "project",
						run: async () => {},
					},
				],
			};`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toHaveLength(2);
		expect(result.map((c) => c.name)).toEqual(["db:seed", "deploy"]);
	});

	test("skips commands with missing name", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default {
				app: { name: "test-app" },
				commands: [
					{
						description: "Missing name",
						category: "project",
						run: async () => {},
					},
					{
						name: "valid-cmd",
						description: "Valid command",
						category: "project",
						run: async () => {},
					},
				],
			};`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("valid-cmd");
	});

	test("skips commands with missing description", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default {
				app: { name: "test-app" },
				commands: [
					{
						name: "no-desc",
						category: "project",
						run: async () => {},
					},
					{
						name: "valid-cmd",
						description: "Valid command",
						category: "project",
						run: async () => {},
					},
				],
			};`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("valid-cmd");
	});

	test("skips commands with missing run function", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default {
				app: { name: "test-app" },
				commands: [
					{
						name: "no-run",
						description: "Missing run",
						category: "project",
					},
					{
						name: "valid-cmd",
						description: "Valid command",
						category: "project",
						run: async () => {},
					},
				],
			};`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("valid-cmd");
	});

	test("defaults category to 'project' when not specified", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default {
				app: { name: "test-app" },
				commands: [
					{
						name: "custom-cmd",
						description: "Custom command",
						run: async () => {},
					},
				],
			};`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toHaveLength(1);
		expect(result[0].category).toBe("project");
	});

	test("returns empty array when config file has syntax error", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "test-app",
				dependencies: { "@bunary/core": "^0.2.0" },
			}),
		);

		await mkdir(join(testDir, "config"), { recursive: true });
		await writeFile(
			join(testDir, "config", "bunary.ts"),
			`export default {{{ invalid syntax`,
		);

		const result = await loadProjectCommands(testDir);
		expect(result).toEqual([]);
	});
});
