import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

describe("package entry points", () => {
	test("bin and library entries are separate files", async () => {
		const pkg = await Bun.file(join(root, "package.json")).json();
		expect(pkg.bin.bunary).toBe("./dist/bin.js");
		expect(pkg.exports["."]).toEqual({
			types: "./dist/index.d.ts",
			import: "./dist/index.js",
			default: "./dist/index.js",
		});
		expect(pkg.exports["./package.json"]).toBe("./package.json");
	});

	test("only bin.ts carries the shebang", async () => {
		const binSrc = await Bun.file(join(root, "src", "bin.ts")).text();
		const libSrc = await Bun.file(join(root, "src", "index.ts")).text();
		expect(binSrc.startsWith("#!/usr/bin/env bun")).toBe(true);
		expect(libSrc.startsWith("#!")).toBe(false);
	});
});

describe("docs match the new command set", () => {
	for (const file of ["docs/index.md", "README.md"]) {
		test(`${file} documents no removed commands`, async () => {
			const text = await Bun.file(join(root, file)).text();
			for (const removed of [
				"route:make",
				"middleware:make",
				"model:make",
				"migration:make",
				"migrate:rollback",
				"migrate:status",
				"bunary migrate",
			]) {
				expect(text).not.toContain(removed);
			}
			expect(text).toContain("make:route");
			expect(text).toContain("drizzle-kit");
		});
	}
});
