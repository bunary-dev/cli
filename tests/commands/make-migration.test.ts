/**
 * migration:make command tests
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeMigration } from "../../src/commands/migration/makeMigration.js";

describe("migration:make command", () => {
	let testDir: string;
	let originalCwd: string;

	beforeEach(async () => {
		originalCwd = process.cwd();
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-make-migration-test-"));
		process.chdir(testDir);

		const packageJson = {
			name: "test-project",
			dependencies: {
				"@bunary/core": "^0.0.5",
				"@bunary/orm": "^0.0.14",
			},
		};
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);
		await mkdir(join(testDir, "migrations"), { recursive: true });
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

	it("should create migration file in ./migrations with timestamp prefix", async () => {
		await makeMigration("create_users_table");

		const migrationsDir = join(testDir, "migrations");
		const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".ts"));
		expect(files.length).toBe(1);
		expect(files[0]).toMatch(/^\d{14}_create_users_table\.ts$/);
	});

	it("should generate up/down with Schema and suggested table name", async () => {
		await makeMigration("create_users_table");

		const migrationsDir = join(testDir, "migrations");
		const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".ts"));
		const content = readFileSync(join(migrationsDir, files[0]), "utf-8");
		expect(content).toContain("export async function up()");
		expect(content).toContain("export async function down()");
		expect(content).toContain("Schema.createTable");
		expect(content).toContain("Schema.dropTable");
		expect(content).toContain('"users"');
	});

	it("should derive table name from create_X_table", async () => {
		await makeMigration("create_posts_table");

		const migrationsDir = join(testDir, "migrations");
		const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".ts"));
		const content = readFileSync(join(migrationsDir, files[0]), "utf-8");
		expect(content).toContain('"posts"');
	});

	it("should not overwrite existing migration when same path exists", async () => {
		const migrationsDir = join(testDir, "migrations");
		// Use same timestamp logic as makeMigration so the path matches
		const timestamp = new Date()
			.toISOString()
			.replace(/[-:T]/g, "")
			.slice(0, 14);
		const existingPath = join(
			migrationsDir,
			`${timestamp}_create_users_table.ts`,
		);
		await writeFile(existingPath, "// existing");

		await expect(makeMigration("create_users_table")).rejects.toThrow(
			/already exists/,
		);
	});

	it("should throw if not in a Bunary project", async () => {
		process.chdir(tmpdir());
		await expect(makeMigration("create_users_table")).rejects.toThrow(
			"Not in a Bunary project",
		);
	});

	it("should throw if project does not have @bunary/orm", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify(
				{
					name: "p",
					dependencies: { "@bunary/core": "^0.0.5" },
				},
				null,
				2,
			),
		);

		await expect(makeMigration("create_users_table")).rejects.toThrow(
			"@bunary/orm",
		);
	});

	it("should create migrations directory if it does not exist", async () => {
		const emptyDir = join(testDir, "empty");
		await mkdir(emptyDir, { recursive: true });
		await writeFile(
			join(emptyDir, "package.json"),
			JSON.stringify(
				{
					name: "p",
					dependencies: { "@bunary/core": "^0.0.5", "@bunary/orm": "^0.0.14" },
				},
				null,
				2,
			),
		);
		process.chdir(emptyDir);

		await makeMigration("create_users_table");

		expect(existsSync(join(emptyDir, "migrations"))).toBe(true);
		const files = readdirSync(join(emptyDir, "migrations")).filter((f) =>
			f.endsWith(".ts"),
		);
		expect(files.length).toBe(1);
	});
});
