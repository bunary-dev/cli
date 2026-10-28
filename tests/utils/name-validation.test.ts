import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
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
import { makeTempDir } from "../helpers/temp-dir.js";

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
		testDir = await makeTempDir("bunary-cli-names-test-");
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

	afterEach(() => {
		process.chdir(originalCwd);
	});

	const cmds: [string, (n: string) => Promise<void>][] = [
		["route", makeRoute],
		["middleware", makeMiddleware],
		["model", makeModel],
		["migration", makeMigration],
	];

	for (const [label, fn] of cmds) {
		for (const bad of ["../../x", "a/b", "foo.bar", "foo bar", "$&", "$1"]) {
			// migration:make normalises whitespace to underscores (#110)
			if (label === "migration" && bad === "foo bar") continue;
			it(`${label}:make rejects ${bad}`, async () => {
				await expect(fn(bad)).rejects.toThrow(/Invalid/);
				expect(existsSync(join(testDir, "..", "x.ts"))).toBe(false);
			});
		}
	}
});
