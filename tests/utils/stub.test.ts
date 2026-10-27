import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findStubsDir, getStubsDir, loadStub } from "../../src/utils/stub.js";

let tmp: string | undefined;
afterEach(() => {
	if (tmp) rmSync(tmp, { recursive: true, force: true });
	tmp = undefined;
});

describe("findStubsDir", () => {
	test("finds stubs next to a renamed bundle", () => {
		tmp = mkdtempSync(join(tmpdir(), "stub-"));
		mkdirSync(join(tmp, "dist", "stubs"), { recursive: true });
		expect(findStubsDir(join(tmp, "dist"))).toBe(join(tmp, "dist", "stubs"));
	});

	test("walks up from nested directories", () => {
		tmp = mkdtempSync(join(tmpdir(), "stub-"));
		mkdirSync(join(tmp, "dist", "stubs"), { recursive: true });
		mkdirSync(join(tmp, "dist", "utils"), { recursive: true });
		expect(findStubsDir(join(tmp, "dist", "utils"))).toBe(
			join(tmp, "dist", "stubs"),
		);
	});

	test("throws when no stubs directory exists", () => {
		tmp = mkdtempSync(join(tmpdir(), "stub-"));
		expect(() => findStubsDir(tmp as string)).toThrow(/stubs/);
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
