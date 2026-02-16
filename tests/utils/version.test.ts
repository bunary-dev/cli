import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { getVersion } from "../../src/utils/version.js";

describe("getVersion()", () => {
	test("returns a valid semver string", () => {
		const version = getVersion();
		expect(version).toMatch(/^\d+\.\d+\.\d+/);
	});

	test("matches package.json version", async () => {
		const pkgPath = join(import.meta.dir, "../../package.json");
		const pkg = await Bun.file(pkgPath).json();
		expect(getVersion()).toBe(pkg.version);
	});
});
