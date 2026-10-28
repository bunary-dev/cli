// Run by tests/temp-dir.test.ts in a subprocess; not matched by `bun test`.
import { beforeEach, test } from "bun:test";
import { makeTempDir } from "../helpers/temp-dir.js";

beforeEach(async () => {
	const dir = await makeTempDir();
	console.log(`TEMP_DIR=${dir}`);
	throw new Error("setup failed");
});

test("never runs", () => {});
