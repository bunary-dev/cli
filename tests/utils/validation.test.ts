/**
 * Validation utilities tests
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { isBunaryProject } from "../../src/utils/validation.js";

describe("isBunaryProject", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = `/tmp/bunary-cli-test-${Date.now()}`;
		await mkdir(testDir, { recursive: true });
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
