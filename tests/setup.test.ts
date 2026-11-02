/**
 * The preload (tests/setup.ts) must make the suite independent of whether
 * stdout is a TTY: tests compare plain text, so colour is off unless a test
 * opts in by deleting NO_COLOR (see tests/utils/color.test.ts).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cyan, dim } from "../src/utils/color.js";

describe("test preload", () => {
	const originalIsTTY = process.stdout.isTTY;

	afterEach(() => {
		Object.defineProperty(process.stdout, "isTTY", {
			value: originalIsTTY,
			writable: true,
			configurable: true,
		});
	});

	test("sets NO_COLOR for every test", () => {
		expect("NO_COLOR" in process.env).toBe(true);
	});

	test("keeps output plain even when stdout is a TTY", () => {
		Object.defineProperty(process.stdout, "isTTY", {
			value: true,
			writable: true,
			configurable: true,
		});
		expect(cyan("make:route")).toBe("make:route");
		expect(dim("(exists)")).toBe("(exists)");
	});
});
