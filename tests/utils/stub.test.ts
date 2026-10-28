import { describe, expect, test } from "bun:test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { findStubsDir, getStubsDir, loadStub } from "../../src/utils/stub.js";
import { makeTempDirSync } from "../helpers/temp-dir.js";

describe("findStubsDir", () => {
	test("finds stubs next to a renamed bundle", () => {
		const tmp = makeTempDirSync("bunary-cli-stub-");
		mkdirSync(join(tmp, "dist", "stubs"), { recursive: true });
		expect(findStubsDir(join(tmp, "dist"))).toBe(join(tmp, "dist", "stubs"));
	});

	test("walks up from nested directories", () => {
		const tmp = makeTempDirSync("bunary-cli-stub-");
		mkdirSync(join(tmp, "dist", "stubs"), { recursive: true });
		mkdirSync(join(tmp, "dist", "utils"), { recursive: true });
		expect(findStubsDir(join(tmp, "dist", "utils"))).toBe(
			join(tmp, "dist", "stubs"),
		);
	});

	test("throws when no stubs directory exists", () => {
		const tmp = makeTempDirSync("bunary-cli-stub-");
		expect(() => findStubsDir(tmp)).toThrow(/stubs/);
	});
});

describe("getStubsDir", () => {
	test("resolves to the repo stubs in development", () => {
		expect(getStubsDir()).toBe(join(import.meta.dir, "../../stubs"));
	});
});

describe("loadStub replacement", () => {
	test("does not expand $ patterns in values", async () => {
		const out = await loadStub("migration/make.ts", { tableName: "a$&b$'c" });
		expect(out).toContain("a$&b$'c");
	});
});
