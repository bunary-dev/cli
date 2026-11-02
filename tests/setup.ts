/**
 * Preloaded for every test file (see bunfig.toml). Hooks registered here run
 * after each test in every file, including failed ones.
 */
import { afterAll, afterEach } from "bun:test";
import { removeTempDirs } from "./helpers/temp-dir.js";

// Tests compare plain text, so turn colour off whether or not stdout is a
// TTY. Colour tests opt back in by deleting NO_COLOR (tests/utils/color.test.ts).
process.env.NO_COLOR = "1";

afterEach(removeTempDirs);
afterAll(removeTempDirs);
