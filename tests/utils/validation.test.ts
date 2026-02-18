/**
 * Validation utilities tests
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	ensureBunaryProject,
	ensureOrmDependency,
	isBunaryProject,
} from "../../src/utils/validation.js";

describe("isBunaryProject", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-test-"));
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	it("should return false when package.json does not exist", () => {
		expect(isBunaryProject(testDir)).toBe(false);
	});

	it("should return false when package.json exists but has no @bunary/core", async () => {
		const packageJson = {
			name: "test-project",
			dependencies: {
				"some-package": "^1.0.0",
			},
		};
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);
		expect(isBunaryProject(testDir)).toBe(false);
	});

	it("should return true when @bunary/core is in dependencies", async () => {
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
		expect(isBunaryProject(testDir)).toBe(true);
	});

	it("should return true when @bunary/core is in devDependencies", async () => {
		const packageJson = {
			name: "test-project",
			devDependencies: {
				"@bunary/core": "^0.0.5",
			},
		};
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);
		expect(isBunaryProject(testDir)).toBe(true);
	});

	it("should return false when package.json is invalid JSON", async () => {
		await writeFile(join(testDir, "package.json"), "invalid json");
		expect(isBunaryProject(testDir)).toBe(false);
	});
});

describe("ensureBunaryProject", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-test-"));
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	it("should throw when not in a Bunary project", () => {
		expect(() => ensureBunaryProject(testDir)).toThrow(
			"Not in a Bunary project",
		);
	});

	it("should not throw when in a Bunary project", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({ dependencies: { "@bunary/core": "^0.2.0" } }),
		);
		expect(() => ensureBunaryProject(testDir)).not.toThrow();
	});
});

describe("ensureOrmDependency", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-test-"));
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	it("should throw when not in a Bunary project", () => {
		expect(() => ensureOrmDependency(testDir)).toThrow(
			"Not in a Bunary project",
		);
	});

	it("should throw when @bunary/orm is missing", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({ dependencies: { "@bunary/core": "^0.2.0" } }),
		);
		expect(() => ensureOrmDependency(testDir)).toThrow("@bunary/orm");
	});

	it("should not throw when @bunary/orm is in dependencies", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				dependencies: { "@bunary/core": "^0.2.0", "@bunary/orm": "^0.1.0" },
			}),
		);
		expect(() => ensureOrmDependency(testDir)).not.toThrow();
	});

	it("should not throw when @bunary/orm is in devDependencies", async () => {
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				dependencies: { "@bunary/core": "^0.2.0" },
				devDependencies: { "@bunary/orm": "^0.1.0" },
			}),
		);
		expect(() => ensureOrmDependency(testDir)).not.toThrow();
	});
});
