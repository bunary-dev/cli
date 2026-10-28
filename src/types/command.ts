/**
 * Command definition for the CLI registry.
 *
 * Each CLI command is a self-contained module that exports a `Command`
 * object describing its name, metadata, and handler. The registry
 * collects these definitions to power dispatch, help output, and
 * "Did you mean?" suggestions from a single source of truth.
 *
 * The shape mirrors the `Command` contract in `@bunary/core`, which is what
 * apps and packages implement so they never depend on the CLI. Commands from
 * outside the CLI are normalized on load (see `utils/normalizeCommand.ts`):
 * core flag names without dashes (`"dry-run"`, alias `"d"`) become
 * `"--dry-run"` / `"-d"` here.
 *
 * @example
 * ```ts
 * import type { Command } from "../types/command.js";
 *
 * export const command: Command = {
 *   name: "make:route",
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
	/** Optional single-character alias (e.g. "-a") */
	alias?: string;
	/** Short description for help output */
	description: string;
	/** Allowed values, if restricted (e.g. ["basic", "jwt"]) */
	values?: string[];
	/**
	 * Whether the flag requires a value (implied when `values` is set).
	 * A flag declaring neither `takesValue` nor `values` is treated as a
	 * boolean switch: it never consumes the next argument, and
	 * `--flag=value` is rejected. Set `takesValue: true` on every flag that
	 * accepts a value.
	 */
	takesValue?: boolean;
	/** Switch that never takes a value (e.g. "--dry-run") */
	boolean?: boolean;
}

/**
 * Help category for grouped output. Built-ins use `"scaffold"`; app
 * commands default to `"project"`; packages may use any label.
 */
export type CommandCategory = "scaffold" | "database" | "project";

/**
 * A CLI command definition.
 *
 * Each command module exports a `Command` object that the registry
 * uses for dispatch, help generation, and suggestion matching.
 *
 * @example
 * ```ts
 * export const command: Command = {
 *   name: "make:route",
 *   description: "Generate a route module",
 *   category: "scaffold",
 *   args: [{ name: "name", required: true, description: "Route name" }],
 *   run: async (args) => {
 *     await makeRoute(args[0] as string);
 *   },
 * };
 * ```
 */
export interface Command {
	/** The command name used on the CLI (e.g. "make:route") */
	name: string;
	/** Short description for help output */
	description: string;
	/** Full usage line for per-command help (e.g. "bunary make:route <name>") */
	usage?: string;
	/** Category for grouped help output */
	category: CommandCategory | (string & {});
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
