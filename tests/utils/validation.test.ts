/**
 * Validation utilities tests
 */
import { beforeEach, describe, expect, it } from "bun:test";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	assertInsideProject,
	ensureBunaryProject,
	isBunaryProject,
} from "../../src/utils/validation.js";
import { makeTempDir } from "../helpers/temp-dir.js";

describe("isBunaryProject", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = await makeTempDir("bunary-cli-test-");
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
		testDir = await makeTempDir("bunary-cli-test-");
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

describe("assertInsideProject", () => {
	let root: string;

	beforeEach(async () => {
		root = await makeTempDir("bunary-cli-test-");
	});

	it("allows files below the project root", () => {
		expect(() =>
			assertInsideProject(root, join(root, "src", "routes", "users.ts")),
		).not.toThrow();
	});

	it("rejects the root itself and paths that escape it", () => {
		for (const target of [
			root,
			join(root, ".."),
			join(root, "..", "evil.ts"),
			join(root, "src", "..", "..", "evil.ts"),
			"/etc/passwd",
		]) {
			expect(() => assertInsideProject(root, target)).toThrow(
				/outside the project/,
			);
		}
	});

	it("rejects a target whose directory is a symlink leading outside", async () => {
		const outside = await makeTempDir("bunary-cli-test-");
		await mkdir(join(root, "src"), { recursive: true });
		await symlink(outside, join(root, "src", "routes"));
		expect(() =>
			assertInsideProject(root, join(root, "src", "routes", "users.ts")),
		).toThrow(/outside the project/);
	});

	it("rejects a target that is itself a symlink leading outside", async () => {
		const outside = await makeTempDir("bunary-cli-test-");
		await mkdir(join(root, "src", "routes"), { recursive: true });
		await symlink(
			join(outside, "x.ts"),
			join(root, "src", "routes", "users.ts"),
		);
		expect(() =>
			assertInsideProject(root, join(root, "src", "routes", "users.ts")),
		).toThrow(/outside the project/);
	});

	it("allows symlinks that stay inside the project", async () => {
		await mkdir(join(root, "lib", "routes"), { recursive: true });
		await mkdir(join(root, "src"), { recursive: true });
		await symlink(join(root, "lib", "routes"), join(root, "src", "routes"));
		expect(() =>
			assertInsideProject(root, join(root, "src", "routes", "users.ts")),
		).not.toThrow();
	});

	it("works when the project root is reached through a symlink", async () => {
		const parent = await makeTempDir("bunary-cli-test-");
		const link = join(parent, "link");
		await symlink(root, link);
		expect(() =>
			assertInsideProject(link, join(link, "src", "routes", "users.ts")),
		).not.toThrow();
	});
});
