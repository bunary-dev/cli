#!/usr/bin/env bun
/**
 * `bunary` executable. The only module with side effects: it runs the CLI
 * on `process.argv` and sets the exit code. Library code lives in index.ts.
 */
import { run } from "./cli.js";

process.exitCode = await run(process.argv.slice(2));
