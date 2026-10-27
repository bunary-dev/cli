/**
 * Flag parsing and validation utilities for the CLI.
 *
 * Extracts `--key value` pairs and boolean `--flag` switches from raw
 * CLI arguments, detects duplicates, and validates flags against
 * command definitions.
 *
 * @example
 * ```ts
 * const [positional, flags] = parseFlags(["my-app", "--auth", "jwt", "--dry-run"]);
 * // positional: ["my-app"]
 * // flags: { auth: "jwt", "dry-run": true }
 * ```
 */

import type { CommandFlag } from "../types/command.js";

/**
 * Parse flags from the argument list.
 *
 * Extracts `--key value` pairs and boolean `--flag` switches,
 * returning the remaining positional args. Throws on duplicate flags.
 *
 * A flag is treated as boolean (set to `true`) when:
 * - It is the last argument, or
 * - The next argument also starts with `--`
 *
 * Also supports `--key=value`, and a bare `--` ends flag parsing. When
 * `flagDefs` is given, flags without `takesValue`/`values` never consume
 * the following argument.
 *
 * @param argv - Raw CLI arguments after the command name
 * @param flagDefs - Optional flag definitions of the command
 * @returns Tuple of [positional args, parsed flags]
 * @throws When a flag is specified more than once
 *
 * @example
 * ```ts
 * const [positional, flags] = parseFlags(["my-app", "--auth", "jwt"]);
 * // positional: ["my-app"], flags: { auth: "jwt" }
 *
 * const [pos, flags2] = parseFlags(["my-app", "--dry-run"]);
 * // pos: ["my-app"], flags2: { "dry-run": true }
 * ```
 */
export function parseFlags(
	argv: string[],
	flagDefs?: CommandFlag[],
): [string[], Record<string, string | boolean>] {
	const positional: string[] = [];
	const flags: Record<string, string | boolean> = {};

	for (let i = 0; i < argv.length; i++) {
		// In-bounds by the loop condition
		const arg = argv[i] as string;

		// Bare `--` ends flag parsing; everything after is positional
		if (arg === "--") {
			positional.push(...argv.slice(i + 1));
			break;
		}

		if (!arg.startsWith("--")) {
			positional.push(arg);
			continue;
		}

		const body = arg.slice(2);
		const eq = body.indexOf("=");
		const key = eq === -1 ? body : body.slice(0, eq);

		if (key in flags) {
			throw new Error(`Duplicate flag: --${key}`);
		}

		if (eq !== -1) {
			flags[key] = body.slice(eq + 1);
			continue;
		}

		// When definitions are known, boolean flags never consume a value
		const def = flagDefs?.find((f) => f.name === `--${key}`);
		if (def && !flagTakesValue(def)) {
			flags[key] = true;
			continue;
		}

		// Boolean flag: last arg or next arg is also a flag
		const next = i + 1 < argv.length ? (argv[i + 1] as string) : undefined;
		if (next === undefined || next.startsWith("--")) {
			flags[key] = true;
		} else {
			flags[key] = next;
			i++; // skip the value
		}
	}

	return [positional, flags];
}

/** Whether a flag expects a value (explicit `takesValue` or restricted `values`). */
function flagTakesValue(def: CommandFlag): boolean {
	return def.takesValue === true || def.values !== undefined;
}

/**
 * Validate parsed flags against a command's flag definitions.
 *
 * Checks that all flags are known by the command, and that values
 * match allowed values when defined. No-ops when flag definitions
 * are `undefined` (commands that accept no flags skip validation).
 *
 * @param flags - Parsed flags from `parseFlags()`
 * @param flagDefs - Flag definitions from the command, or `undefined`
 * @throws When an unknown flag is used or a value is not in the allowed set
 *
 * @example
 * ```ts
 * const defs: CommandFlag[] = [
 *   { name: "--auth", description: "Auth type", values: ["basic", "jwt"] },
 * ];
 * validateFlags({ auth: "jwt" }, defs);    // OK
 * validateFlags({ auth: "oauth" }, defs);  // throws
 * validateFlags({ unknown: "x" }, defs);   // throws
 * ```
 */
export function validateFlags(
	flags: Record<string, string | boolean>,
	flagDefs: CommandFlag[] | undefined,
): void {
	if (!flagDefs) return;

	const knownFlags = new Set(flagDefs.map((f) => f.name.replace(/^--/, "")));

	for (const [key, value] of Object.entries(flags)) {
		if (!knownFlags.has(key)) {
			throw new Error(`Unknown flag: --${key}`);
		}

		const def = flagDefs.find((f) => f.name === `--${key}`);
		if (def && flagTakesValue(def) && typeof value !== "string") {
			throw new Error(`--${key} requires a value`);
		}
		if (
			def?.values &&
			typeof value === "string" &&
			!def.values.includes(value)
		) {
			throw new Error(
				`Invalid value "${value}" for --${key}. Allowed: ${def.values.join(", ")}`,
			);
		}
	}
}
