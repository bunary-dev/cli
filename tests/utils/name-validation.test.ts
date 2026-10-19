import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeMiddleware } from "../../src/commands/middleware/makeMiddleware.js";
import { makeMigration } from "../../src/commands/migration/makeMigration.js";
import { makeModel } from "../../src/commands/model/makeModel.js";
import { makeRoute } from "../../src/commands/route/makeRoute.js";
import { loadStub } from "../../src/utils/stub.js";
import {
	assertInsideDir,
	validateMakeName,
} from "../../src/utils/validation.js";

describe("validateMakeName", () => {
	it("accepts valid names", () => {
		for (const n of ["users", "user-profile", "user_profile", "User2", "a"]) {
			expect(() => validateMakeName(n, "Route")).not.toThrow();
		}
	});

	it("rejects invalid names", () => {
		for (const n of [
			"",
			"../x",
			"a/b",
			"a\\b",
			"..",
			"foo.bar",
			"foo bar",
			"1abc",
			"$&",
			"a'b",
		]) {
			expect(() => validateMakeName(n, "Route")).toThrow(/Invalid Route name/);
		}
	});
});

describe("assertInsideDir", () => {
	it("throws when path escapes", () => {
		expect(() => assertInsideDir("/a/b", "/a/c/x.ts")).toThrow();
		expect(() => assertInsideDir("/a/b", "/a/b/../x.ts")).toThrow();
	});
	it("allows contained path", () => {
		expect(() => assertInsideDir("/a/b", "/a/b/x.ts")).not.toThrow();
	});
});

describe("loadStub", () => {
	it("treats $ sequences literally", async () => {
		const out = await loadStub("route/make.ts", {
			routeName: "$&",
			functionName: "$1$$",
		});
		expect(out).toContain("$&");
		expect(out).toContain("$1$$");
	});
});

describe("make commands reject unsafe names", () => {
	let testDir: string;
	let originalCwd: string;

	beforeEach(async () => {
		originalCwd = process.cwd();
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-names-test-"));
		process.chdir(testDir);
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({
				name: "t",
				dependencies: { "@bunary/core": "^0", "@bunary/orm": "^0" },
			}),
		);
		await mkdir(join(testDir, "src"), { recursive: true });
	});

	afterEach(async () => {
		process.chdir(originalCwd);
		await rm(testDir, { recursive: true, force: true });
	});

	const cmds: [string, (n: string) => Promise<void>][] = [
		["route", makeRoute],
		["middleware", makeMiddleware],
		["model", makeModel],
		["migration", makeMigration],
	];

	for (const [label, fn] of cmds) {
		for (const bad of ["../../x", "a/b", "foo.bar", "foo bar", "$&", "$1"]) {
			it(`${label}:make rejects ${bad}`, async () => {
				await expect(fn(bad)).rejects.toThrow(/Invalid/);
				expect(existsSync(join(testDir, "..", "x.ts"))).toBe(false);
			});
		}
	}
});
