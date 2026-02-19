/**
 * Load project-level commands from the user's Bunary config file.
 *
 * Searches for a config file at `config/bunary.ts` (preferred) or
 * `bunary.config.ts` (fallback), dynamically imports it, and extracts
 * the `commands` array. Each entry is validated for required fields
 * (`name`, `description`, `run`) and defaults `category` to `"project"`.
 *
 * Returns an empty array when:
 * - The directory is not a Bunary project
 * - No config file exists
 * - The config has no `commands` key
 * - The config file fails to load
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "../types/command.js";
import { isBunaryProject } from "./validation.js";

/** Config file paths to try, in priority order. */
const CONFIG_PATHS = ["config/bunary.ts", "bunary.config.ts"] as const;

/**
 * Check whether a value looks like a valid `Command` definition.
 *
 * A command must have at minimum a string `name`, string `description`,
 * and a `run` function.
 *
 * @param entry - The value to validate
 * @returns `true` if the entry has the required command shape
 *
 * @example
 * ```ts
 * isValidCommand({ name: "seed", description: "Seed DB", run: async () => {} }); // true
 * isValidCommand({ description: "No name" }); // false
 * ```
 */
function isValidCommand(entry: unknown): entry is Command {
	if (typeof entry !== "object" || entry === null) return false;
	const obj = entry as Record<string, unknown>;
	return (
		typeof obj.name === "string" &&
		obj.name.length > 0 &&
		typeof obj.description === "string" &&
		typeof obj.run === "function"
	);
}

/**
 * Resolve the config file path inside a project directory.
 *
 * Tries `config/bunary.ts` first, then `bunary.config.ts`.
 *
 * @param cwd - Project root directory
 * @returns Absolute path to the config file, or `undefined` if none exists
 *
 * @example
 * ```ts
 * const path = resolveConfigPath("/my/project");
 * // "/my/project/config/bunary.ts" or undefined
 * ```
 */
function resolveConfigPath(cwd: string): string | undefined {
	for (const relative of CONFIG_PATHS) {
		const absolute = join(cwd, relative);
		if (existsSync(absolute)) return absolute;
	}
	return undefined;
}

/**
 * Load project-level commands from the Bunary config file.
 *
 * Dynamically imports the user's config, extracts the `commands` array,
 * validates each entry, and defaults `category` to `"project"`.
 *
 * @param cwd - Project root directory (defaults to `process.cwd()`)
 * @returns Array of validated project commands, or empty array on failure
 *
 * @example
 * ```ts
 * const cmds = await loadProjectCommands("/path/to/project");
 * for (const cmd of cmds) {
 *   console.log(cmd.name); // "db:seed", "deploy", etc.
 * }
 * ```
 */
export async function loadProjectCommands(
	cwd: string = process.cwd(),
): Promise<Command[]> {
	if (!isBunaryProject(cwd)) return [];

	const configPath = resolveConfigPath(cwd);
	if (!configPath) return [];

	let config: Record<string, unknown>;
	try {
		const mod = await import(configPath);
		config = mod.default ?? mod;
	} catch {
		return [];
	}

	const raw = config.commands;
	if (!Array.isArray(raw) || raw.length === 0) return [];

	const validated: Command[] = [];
	for (const entry of raw) {
		if (!isValidCommand(entry)) continue;
		validated.push({
			...entry,
			category: entry.category ?? "project",
		});
	}

	return validated;
}
