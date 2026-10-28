import { describe, expect, test } from "bun:test";
import { getCommandNames } from "../../src/registry.js";
import { levenshtein, suggestCommand } from "../../src/utils/suggest.js";

describe("levenshtein", () => {
	test("returns 0 for identical strings", () => {
		expect(levenshtein("init", "init")).toBe(0);
	});

	test("returns length of other string when one is empty", () => {
		expect(levenshtein("", "init")).toBe(4);
		expect(levenshtein("init", "")).toBe(4);
	});

	test("returns 0 for two empty strings", () => {
		expect(levenshtein("", "")).toBe(0);
	});

	test("handles single-character edit (substitution)", () => {
		expect(levenshtein("init", "inot")).toBe(1);
	});

	test("handles single-character edit (insertion)", () => {
		expect(levenshtein("init", "iinit")).toBe(1);
	});

	test("handles single-character edit (deletion)", () => {
		expect(levenshtein("init", "int")).toBe(1);
	});

	test("handles multiple edits", () => {
		expect(levenshtein("migrate", "migarte")).toBe(2);
	});

	test("handles completely different strings", () => {
		expect(levenshtein("abc", "xyz")).toBe(3);
	});
});

describe("suggestCommand", () => {
	test("returns exact match for known command", () => {
		expect(suggestCommand("init")).toBe("init");
	});

	test("suggests correct command for single-character typo", () => {
		expect(suggestCommand("iinit")).toBe("init");
	});

	test("suggests correct command for prefix match", () => {
		expect(suggestCommand("ini")).toBe("init");
	});

	test("suggests correct command for make:route typo", () => {
		expect(suggestCommand("make:rout")).toBe("make:route");
	});

	test("suggests correct command for transposed characters", () => {
		expect(suggestCommand("make:roteu")).toBe("make:route");
	});

	test("suggests make:provider for close typo", () => {
		expect(suggestCommand("make:provder")).toBe("make:provider");
	});

	test("returns null when nothing is close (distance > 2)", () => {
		expect(suggestCommand("foobar")).toBeNull();
	});

	test("returns null for completely unrelated input", () => {
		expect(suggestCommand("deploy")).toBeNull();
	});

	test("returns null for empty input", () => {
		expect(suggestCommand("")).toBeNull();
	});

	test("suggests make:middleware for close typo", () => {
		expect(suggestCommand("make:middlewar")).toBe("make:middleware");
	});

	test("suggests make:command for close typo", () => {
		expect(suggestCommand("make:comand")).toBe("make:command");
	});

	test("returns null when prefix matches multiple commands", () => {
		// "make:" is a prefix of every make:* command
		expect(suggestCommand("make:")).toBeNull();
	});

	test("suggests when prefix matches exactly one command", () => {
		// "make:r" is a prefix of only "make:route"
		expect(suggestCommand("make:r")).toBe("make:route");
	});
});

describe("command names from registry", () => {
	test("contains all CLI commands", () => {
		const names = getCommandNames();
		expect(names).toContain("init");
		expect(names).toContain("make:route");
		expect(names).toContain("make:middleware");
		expect(names).toContain("make:command");
		expect(names).toContain("make:provider");
	});

	test("returns an array", () => {
		expect(Array.isArray(getCommandNames())).toBe(true);
	});
});
