/**
 * Publishing must never pack a stale `dist/` (#149): `npm publish` ships
 * whatever is in `dist/`, so `build` and `prepublishOnly` empty it first.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

async function scripts(): Promise<Record<string, string>> {
	const pkg = await Bun.file(join(root, "package.json")).json();
	return pkg.scripts;
}

describe("publish scripts (#149)", () => {
	test("clean removes dist", async () => {
		expect((await scripts()).clean).toBe("rm -rf dist");
	});

	test("build starts with bun run clean", async () => {
		expect((await scripts()).build).toStartWith("bun run clean && ");
	});

	test("prepublishOnly runs clean, then build, then tests and typecheck", async () => {
		expect((await scripts()).prepublishOnly).toBe(
			"bun run clean && bun run build && bun test && bun run typecheck",
		);
	});
});
