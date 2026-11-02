/**
 * Command definition for the CLI registry.
 *
 * The contract is `Command` from `@bunary/core`, which apps and packages
 * implement so they never depend on the CLI. The registry works on a
 * normalized form of it, defined here as a thin extension:
 *
 * - flag names carry their dashes (`"--dry-run"`, alias `"-d"`). Commands
 *   from outside the CLI are normalized on load (see
 *   `utils/normalizeCommand.ts`), so core flag names without dashes
 *   (`"dry-run"`, alias `"d"`) are accepted;
 * - `usage` is optional (built-ins derive it from `name` and `args`);
 * - flags may declare `takesValue` / `boolean`.
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
import type {
	CommandArg,
	Command as CoreCommand,
	CommandFlag as CoreCommandFlag,
} from "@bunary/core";

export type { CommandArg, CoreCommand, CoreCommandFlag };

/**
 * A flag accepted by a command: core's `CommandFlag` with the name spelled
 * with dashes, plus value handling.
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
export interface CommandFlag extends CoreCommandFlag {
	/** Flag name including dashes (e.g. "--auth") */
	name: string;
	/** Optional single-character alias including the dash (e.g. "-a") */
	alias?: string;
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
 * A command as held by the registry: core's `Command` with optional
 * `usage` and CLI-style {@link CommandFlag}s.
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
export interface Command
	extends Omit<CoreCommand, "usage" | "category" | "flags"> {
	/** Full usage line for per-command help (e.g. "bunary make:route <name>") */
	usage?: string;
	/** Category for grouped help output */
	category: CommandCategory | (string & {});
	/** Supported flags */
	flags?: CommandFlag[];
}
