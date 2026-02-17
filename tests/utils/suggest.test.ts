import { describe, expect, test } from "bun:test";
import {
	KNOWN_COMMANDS,
	levenshtein,
	suggestCommand,
} from "../../src/utils/suggest.js";

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

	test("suggests correct command for route:make typo", () => {
		expect(suggestCommand("route:mak")).toBe("route:make");
	});

	test("suggests correct command for transposed characters", () => {
		expect(suggestCommand("mirgrate")).toBe("migrate");
	});

	test("suggests migrate:rollback for close typo", () => {
		expect(suggestCommand("migrate:rolback")).toBe("migrate:rollback");
	});

	test("suggests model:make for close typo", () => {
		expect(suggestCommand("model:mak")).toBe("model:make");
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

	test("suggests middleware:make for close typo", () => {
		expect(suggestCommand("middleware:mak")).toBe("middleware:make");
	});

	test("suggests migration:make for close typo", () => {
		expect(suggestCommand("migration:mak")).toBe("migration:make");
	});

	test("suggests migrate:status for close typo", () => {
		expect(suggestCommand("migrate:statu")).toBe("migrate:status");
	});

	test("returns null when prefix matches multiple commands", () => {
		// "migr" is a prefix of migrate, migrate:rollback, migrate:status, migration:make
		expect(suggestCommand("migr")).toBeNull();
	});

	test("suggests when prefix matches exactly one command", () => {
		// "route" is a prefix of only "route:make"
		expect(suggestCommand("route")).toBe("route:make");
	});
});

describe("KNOWN_COMMANDS", () => {
	test("contains all CLI commands", () => {
		expect(KNOWN_COMMANDS).toContain("init");
		expect(KNOWN_COMMANDS).toContain("route:make");
		expect(KNOWN_COMMANDS).toContain("middleware:make");
		expect(KNOWN_COMMANDS).toContain("model:make");
		expect(KNOWN_COMMANDS).toContain("migration:make");
		expect(KNOWN_COMMANDS).toContain("migrate");
		expect(KNOWN_COMMANDS).toContain("migrate:rollback");
		expect(KNOWN_COMMANDS).toContain("migrate:status");
	});

	test("is a readonly array", () => {
		expect(Array.isArray(KNOWN_COMMANDS)).toBe(true);
	});
});
