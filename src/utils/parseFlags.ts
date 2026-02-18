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
 * @param argv - Raw CLI arguments after the command name
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
): [string[], Record<string, string | boolean>] {
	const positional: string[] = [];
	const flags: Record<string, string | boolean> = {};

	for (let i = 0; i < argv.length; i++) {
		if (argv[i].startsWith("--")) {
			const key = argv[i].slice(2);

			if (key in flags) {
				throw new Error(`Duplicate flag: --${key}`);
			}

			// Boolean flag: last arg or next arg is also a flag
			if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
				flags[key] = true;
			} else {
				flags[key] = argv[i + 1];
				i++; // skip the value
			}
		} else {
			positional.push(argv[i]);
		}
	}

	return [positional, flags];
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
