// Run by tests/temp-dir.test.ts in a subprocess; not matched by `bun test`.
import { expect, test } from "bun:test";
import { makeTempDir } from "../helpers/temp-dir.js";

test("fails after creating a temp dir", async () => {
	const dir = await makeTempDir();
	console.log(`TEMP_DIR=${dir}`);
	expect(true).toBe(false);
});
