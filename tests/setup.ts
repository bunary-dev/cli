/**
 * Preloaded for every test file (see bunfig.toml). Hooks registered here run
 * after each test in every file, including failed ones.
 */
import { afterAll, afterEach } from "bun:test";
import { removeTempDirs } from "./helpers/temp-dir.js";

afterEach(removeTempDirs);
afterAll(removeTempDirs);
