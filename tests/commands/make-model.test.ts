/**
 * make:model command tests
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeModel } from "../../src/commands/model/makeModel.js";

describe("make:model command", () => {
	let testDir: string;
	let originalCwd: string;

	beforeEach(async () => {
		// Capture the current working directory at the start of each test
		originalCwd = process.cwd();
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-make-model-test-"));
		process.chdir(testDir);

		// Create a valid Bunary project structure
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
		await mkdir(join(testDir, "src"), { recursive: true });
	});

	afterEach(async () => {
		// Try to change back to original directory, but don't fail if it doesn't exist
		try {
			if (originalCwd && existsSync(originalCwd)) {
				process.chdir(originalCwd);
			}
		} catch (error) {
			// Ignore chdir errors - directory might have been cleaned up
		}
		// Clean up test directory
		if (testDir) {
			try {
				await rm(testDir, { recursive: true, force: true });
			} catch (error) {
				// Ignore cleanup errors
			}
		}
	});

	it("should create model file in src/models directory", async () => {
		await makeModel("users");

		const modelPath = join(testDir, "src", "models", "Users.ts");
		expect(existsSync(modelPath)).toBe(true);
	});

	it("should convert snake_case table name to PascalCase model name", async () => {
		await makeModel("user_profile");

		const modelPath = join(testDir, "src", "models", "UserProfile.ts");
		expect(existsSync(modelPath)).toBe(true);
	});

	it("should generate model with correct class name", async () => {
		await makeModel("users");

		const modelPath = join(testDir, "src", "models", "Users.ts");
		const content = readFileSync(modelPath, "utf-8");
		expect(content).toContain("export class Users");
		expect(content).toContain('tableName = "users"');
	});

	it("should generate model with correct table name", async () => {
		await makeModel("user_profile");

		const modelPath = join(testDir, "src", "models", "UserProfile.ts");
		const content = readFileSync(modelPath, "utf-8");
		expect(content).toContain("export class UserProfile");
		expect(content).toContain('tableName = "user_profile"');
	});

	it("should not overwrite existing model file", async () => {
		await mkdir(join(testDir, "src", "models"), { recursive: true });
		const existingPath = join(testDir, "src", "models", "Users.ts");
		await writeFile(existingPath, "// Existing file");

		await expect(makeModel("users")).rejects.toThrow();

		const content = readFileSync(existingPath, "utf-8");
		expect(content).toBe("// Existing file");
	});

	it("should create src/models directory if it doesn't exist", async () => {
		await makeModel("users");

		expect(existsSync(join(testDir, "src", "models"))).toBe(true);
	});

	it("should throw error if not in a Bunary project", async () => {
		// Remove package.json
		await rm(join(testDir, "package.json"));

		await expect(makeModel("users")).rejects.toThrow();
	});

	it("should throw error if package.json doesn't have @bunary/core", async () => {
		const packageJson = {
			name: "test-project",
			dependencies: {},
		};
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);

		await expect(makeModel("users")).rejects.toThrow();
	});

	it("should generate model with BaseModel import", async () => {
		await makeModel("users");

		const modelPath = join(testDir, "src", "models", "Users.ts");
		const content = readFileSync(modelPath, "utf-8");
		expect(content).toContain('import { BaseModel } from "@bunary/orm"');
		expect(content).toContain("extends BaseModel");
	});

	it("should generate model with JSDoc comments", async () => {
		await makeModel("users");

		const modelPath = join(testDir, "src", "models", "Users.ts");
		const content = readFileSync(modelPath, "utf-8");
		expect(content).toContain("/**");
		expect(content).toContain("Users Model");
		expect(content).toContain("@example");
	});
});
