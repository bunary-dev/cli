import { describe, expect, test } from "bun:test";
import { buildFileTree } from "../../src/utils/fileTree.js";

describe("buildFileTree()", () => {
	test("renders a single file under root", () => {
		const result = buildFileTree("my-app", ["package.json"]);
		expect(result).toContain("my-app/");
		expect(result).toContain("└── package.json");
	});

	test("renders multiple files at root level", () => {
		const result = buildFileTree("my-app", [
			"package.json",
			"bunary.config.ts",
		]);
		expect(result).toContain("├── package.json");
		expect(result).toContain("└── bunary.config.ts");
	});

	test("renders nested directories", () => {
		const result = buildFileTree("my-app", [
			"package.json",
			"src/index.ts",
		]);
		// Directories sort before files
		expect(result).toContain("├── src/");
		// src/ is not last, so child prefix is │
		expect(result).toContain("│   └── index.ts");
		expect(result).toContain("└── package.json");
	});

	test("renders the default init file list correctly", () => {
		const files = [
			"package.json",
			"bunary.config.ts",
			"src/index.ts",
			"src/routes/index.ts",
			"src/routes/main.ts",
			"src/routes/groupExample.ts",
		];

		const result = buildFileTree("my-app", files);

		// Root
		expect(result).toContain("my-app/");
		// src directory first (dirs before files)
		expect(result).toContain("├── src/");
		// routes/ is a dir, comes before index.ts file in src/
		expect(result).toContain("├── routes/");
		// route files
		expect(result).toContain("├── main.ts");
		expect(result).toContain("└── groupExample.ts");
		// index.ts is a file so comes after routes/ dir
		expect(result).toContain("└── index.ts");
		// Top-level files come after directories
		expect(result).toContain("├── package.json");
		expect(result).toContain("└── bunary.config.ts");
	});

	test("renders auth scaffold with middleware directory", () => {
		const files = [
			"package.json",
			"bunary.config.ts",
			"src/index.ts",
			"src/middleware/jwt.ts",
			"src/routes/index.ts",
			"src/routes/main.ts",
			"src/routes/groupExample.ts",
		];

		const result = buildFileTree("my-app", files);

		expect(result).toContain("middleware/");
		expect(result).toContain("jwt.ts");
		expect(result).toContain("routes/");
	});

	test("includes file count at the bottom", () => {
		const files = [
			"package.json",
			"bunary.config.ts",
			"src/index.ts",
		];

		const result = buildFileTree("my-app", files);
		expect(result).toContain("3 files");
	});

	test("file count is correct for auth scaffold (7 files)", () => {
		const files = [
			"package.json",
			"bunary.config.ts",
			"src/index.ts",
			"src/middleware/jwt.ts",
			"src/routes/index.ts",
			"src/routes/main.ts",
			"src/routes/groupExample.ts",
		];

		const result = buildFileTree("my-app", files);
		expect(result).toContain("7 files");
	});

	test("singular 'file' for single file", () => {
		const result = buildFileTree("my-app", ["package.json"]);
		expect(result).toContain("1 file");
		expect(result).not.toContain("1 files");
	});

	test("returns a string with newlines", () => {
		const result = buildFileTree("my-app", ["package.json"]);
		expect(typeof result).toBe("string");
		expect(result).toContain("\n");
	});

	test("handles empty file list", () => {
		const result = buildFileTree("my-app", []);
		expect(result).toContain("my-app/");
		expect(result).toContain("0 files");
	});

	test("handles deeply nested paths", () => {
		const result = buildFileTree("app", [
			"src/a/b/c/deep.ts",
		]);
		expect(result).toContain("app/");
		expect(result).toContain("src/");
		expect(result).toContain("a/");
		expect(result).toContain("b/");
		expect(result).toContain("c/");
		expect(result).toContain("deep.ts");
	});

	test("directories are sorted before files at each level", () => {
		const files = [
			"README.md",
			"src/index.ts",
			"package.json",
		];

		const result = buildFileTree("my-app", files);
		const lines = result.split("\n");

		// Find lines containing our entries (skip root)
		const readmeLine = lines.findIndex((l) => l.includes("README.md"));
		const packageLine = lines.findIndex((l) => l.includes("package.json"));
		const srcLine = lines.findIndex((l) => l.includes("src/"));

		// src/ directory should come before loose files
		expect(srcLine).toBeLessThan(readmeLine);
		expect(srcLine).toBeLessThan(packageLine);
	});

	test("each line has consistent indentation", () => {
		const files = [
			"package.json",
			"src/index.ts",
			"src/routes/main.ts",
		];

		const result = buildFileTree("my-app", files);
		const lines = result.split("\n").filter((l) => l.trim());

		// Root line should start with the root name
		expect(lines[0]).toContain("my-app/");

		// All tree lines (after root, before count) should use tree characters
		const treeLines = lines.slice(1, -1);
		for (const line of treeLines) {
			expect(line).toMatch(/[├└│ ]/);
		}
	});
});
