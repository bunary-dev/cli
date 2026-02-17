import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// We need to re-import after changing env, so we use dynamic imports.
async function loadColor() {
	// Bust the module cache so each test gets a fresh `enabled` evaluation
	const path = "../../src/utils/color.js";
	const mod = await import(`${path}?t=${Date.now()}-${Math.random()}`);
	return mod;
}

describe("color utilities", () => {
	const originalEnv = process.env.NO_COLOR;
	const originalIsTTY = process.stdout.isTTY;

	afterEach(() => {
		// Restore originals
		if (originalEnv === undefined) {
			delete process.env.NO_COLOR;
		} else {
			process.env.NO_COLOR = originalEnv;
		}
		Object.defineProperty(process.stdout, "isTTY", {
			value: originalIsTTY,
			writable: true,
			configurable: true,
		});
	});

	describe("when colors are enabled (TTY, no NO_COLOR)", () => {
		beforeEach(() => {
			delete process.env.NO_COLOR;
			Object.defineProperty(process.stdout, "isTTY", {
				value: true,
				writable: true,
				configurable: true,
			});
		});

		test("bold wraps text with ANSI bold codes", async () => {
			const { bold } = await loadColor();
			expect(bold("hello")).toBe("\x1b[1mhello\x1b[22m");
		});

		test("dim wraps text with ANSI dim codes", async () => {
			const { dim } = await loadColor();
			expect(dim("hello")).toBe("\x1b[2mhello\x1b[22m");
		});

		test("red wraps text with ANSI red codes", async () => {
			const { red } = await loadColor();
			expect(red("error")).toBe("\x1b[31merror\x1b[39m");
		});

		test("green wraps text with ANSI green codes", async () => {
			const { green } = await loadColor();
			expect(green("ok")).toBe("\x1b[32mok\x1b[39m");
		});

		test("yellow wraps text with ANSI yellow codes", async () => {
			const { yellow } = await loadColor();
			expect(yellow("warn")).toBe("\x1b[33mwarn\x1b[39m");
		});

		test("cyan wraps text with ANSI cyan codes", async () => {
			const { cyan } = await loadColor();
			expect(cyan("info")).toBe("\x1b[36minfo\x1b[39m");
		});

		test("helpers can be composed", async () => {
			const { bold, cyan } = await loadColor();
			const result = bold(cyan("hello"));
			expect(result).toContain("\x1b[36m");
			expect(result).toContain("\x1b[1m");
			expect(result).toContain("hello");
		});
	});

	describe("when NO_COLOR is set", () => {
		beforeEach(() => {
			process.env.NO_COLOR = "1";
			Object.defineProperty(process.stdout, "isTTY", {
				value: true,
				writable: true,
				configurable: true,
			});
		});

		test("bold returns plain text", async () => {
			const { bold } = await loadColor();
			expect(bold("hello")).toBe("hello");
		});

		test("red returns plain text", async () => {
			const { red } = await loadColor();
			expect(red("error")).toBe("error");
		});

		test("green returns plain text", async () => {
			const { green } = await loadColor();
			expect(green("ok")).toBe("ok");
		});

		test("cyan returns plain text", async () => {
			const { cyan } = await loadColor();
			expect(cyan("info")).toBe("info");
		});
	});

	describe("when stdout is not a TTY", () => {
		beforeEach(() => {
			delete process.env.NO_COLOR;
			Object.defineProperty(process.stdout, "isTTY", {
				value: false,
				writable: true,
				configurable: true,
			});
		});

		test("bold returns plain text", async () => {
			const { bold } = await loadColor();
			expect(bold("hello")).toBe("hello");
		});

		test("red returns plain text", async () => {
			const { red } = await loadColor();
			expect(red("error")).toBe("error");
		});
	});
});
