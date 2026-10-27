import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

describe("docs match the bin-only package", () => {
	test("package.json exposes no library entry", async () => {
		const pkg = await Bun.file(join(root, "package.json")).json();
		expect(Object.keys(pkg.exports)).toEqual(["./package.json"]);
	});

	test("docs do not document a programmatic API", async () => {
		for (const file of ["docs/index.md", "README.md"]) {
			const text = await Bun.file(join(root, file)).text();
			expect(text).not.toMatch(/Programmatic API/i);
			expect(text).not.toMatch(/programmatic API/i);
			expect(text).not.toContain('from "@bunary/cli"');
		}
	});
});
