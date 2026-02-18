/**
 * Command definition for the CLI registry.
 *
 * Each CLI command is a self-contained module that exports a `Command`
 * object describing its name, metadata, and handler. The registry
 * collects these definitions to power dispatch, help output, and
 * "Did you mean?" suggestions from a single source of truth.
 *
 * @example
 * ```ts
 * import type { Command } from "../types/command.js";
 *
 * export const command: Command = {
 *   name: "route:make",
 *   description: "Generate a route module",
 *   category: "scaffold",
 *   args: [{ name: "name", required: true, description: "Route name" }],
 *   run: async (args) => {
 *     await makeRoute(args[0]);
 *   },
 * };
 * ```
 */

/**
 * A positional argument accepted by a command.
 *
 * @example
 * ```ts
 * const arg: CommandArg = { name: "name", required: true, description: "Route name" };
 * ```
 */
export interface CommandArg {
	/** Argument name shown in usage (e.g. "name", "table") */
	name: string;
	/** Whether the argument is required */
	required: boolean;
	/** Short description for help output */
	description: string;
}

/**
 * A flag accepted by a command.
 *
 * @example
 * ```ts
 * const flag: CommandFlag = {
 *   name: "--auth",
 *   description: "Auth scaffolding type",
 *   values: ["basic", "jwt"],
 * };
 * ```
 */
export interface CommandFlag {
	/** Flag name including dashes (e.g. "--auth") */
	name: string;
	/** Optional short alias (e.g. "-a") */
	alias?: string;
	/** Short description for help output */
	description: string;
	/** Allowed values, if restricted (e.g. ["basic", "jwt"]) */
	values?: string[];
}

/** Help category for grouped output. */
export type CommandCategory = "scaffold" | "database";

/**
 * A CLI command definition.
 *
 * Each command module exports a `Command` object that the registry
 * uses for dispatch, help generation, and suggestion matching.
 *
 * @example
 * ```ts
 * export const command: Command = {
 *   name: "migrate",
 *   description: "Run pending migrations",
 *   category: "database",
 *   run: async () => {
 *     await migrateUp();
 *   },
 * };
 * ```
 */
export interface Command {
	/** The command name used on the CLI (e.g. "route:make") */
	name: string;
	/** Short description for help output */
	description: string;
	/** Category for grouped help output */
	category: CommandCategory;
	/** Required positional arguments */
	args?: CommandArg[];
	/** Supported flags */
	flags?: CommandFlag[];
	/** The handler function */
	run: (
		args: string[],
		flags: Record<string, string | boolean>,
	) => Promise<void>;
}
