/**
 * Zero-dependency ANSI color helpers for terminal output.
 *
 * Respects the `NO_COLOR` convention (https://no-color.org/) and
 * non-TTY pipes — when either is detected, all helpers return the
 * input string unchanged so piped / redirected output stays clean.
 *
 * @example
 * ```ts
 * import { bold, cyan, green, red } from "../utils/color.js";
 *
 * console.log(bold("Commands"));
 * console.log(green("✅ Created route: src/routes/users.ts"));
 * console.log(red("Error: Not in a Bunary project"));
 * console.log(`  ${cyan("bunary")} init my-app`);
 * ```
 */

// NO_COLOR spec: presence of the variable (even empty) disables color.
const enabled = process.stdout.isTTY === true && !("NO_COLOR" in process.env);

/** Bold text — use for section headers and emphasis. */
export const bold = (s: string): string =>
	enabled ? `\x1b[1m${s}\x1b[22m` : s;

/** Dim/gray text — use for secondary info like argument placeholders. */
export const dim = (s: string): string => (enabled ? `\x1b[2m${s}\x1b[22m` : s);

/** Red text — use for errors. */
export const red = (s: string): string =>
	enabled ? `\x1b[31m${s}\x1b[39m` : s;

/** Green text — use for success messages. */
export const green = (s: string): string =>
	enabled ? `\x1b[32m${s}\x1b[39m` : s;

/** Yellow text — use for warnings. */
export const yellow = (s: string): string =>
	enabled ? `\x1b[33m${s}\x1b[39m` : s;

/** Cyan text — use for commands, paths, and keywords. */
export const cyan = (s: string): string =>
	enabled ? `\x1b[36m${s}\x1b[39m` : s;
