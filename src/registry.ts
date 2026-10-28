/**
 * Command registry — single source of truth for all CLI commands.
 *
 * Holds the built-in scaffolding commands, plus commands registered at
 * startup from installed `@bunary/*` packages and from the app's config
 * (see {@link registerCommands}). Provides lookup helpers used by the
 * dispatcher, help output, and suggestions.
 *
 * @example
 * ```ts
 * import { commands, findCommand, getCommandNames } from "./registry.js";
 *
 * const cmd = findCommand("init");
 * if (cmd) await cmd.run(args, flags);
 * ```
 */

import { command as makeCommandCommand } from "./commands/command/makeCommand.js";
import { command as initCommand } from "./commands/init.js";
import { command as middlewareMakeCommand } from "./commands/middleware/makeMiddleware.js";
import { command as providerMakeCommand } from "./commands/provider/makeProvider.js";
import { command as routeMakeCommand } from "./commands/route/makeRoute.js";
import type { Command } from "./types/command.js";

/** Built-in commands that ship with the CLI. */
const builtinCommands: readonly Command[] = [
	initCommand,
	routeMakeCommand,
	middlewareMakeCommand,
	makeCommandCommand,
	providerMakeCommand,
];

/** All registered CLI commands (built-in, package, project). */
export let commands: readonly Command[] = [...builtinCommands];

/** Where each non-built-in command came from, for collision messages. */
const origins = new Map<string, string>();

/**
 * Register commands from one source (a package name or a config file).
 *
 * The whole batch is rejected, and nothing from it registered, when any
 * name collides with a built-in, with a command from another source, or
 * with another command in the same batch.
 *
 * @param newCommands - Commands to add
 * @param origin - Where they come from, e.g. "@bunary/orm" or "config/bunary.ts"
 * @throws When a name collides
 *
 * @example
 * ```ts
 * registerCommands(ormCommands, "@bunary/orm");
 * ```
 */
export function registerCommands(newCommands: Command[], origin: string): void {
	const builtinNames = new Set(builtinCommands.map((c) => c.name));
	const seen = new Set<string>();

	for (const cmd of newCommands) {
		if (builtinNames.has(cmd.name)) {
			throw new Error(
				`Cannot override built-in command "${cmd.name}" (from ${origin}). Choose a different name.`,
			);
		}
		const other = origins.get(cmd.name);
		if (other !== undefined) {
			throw new Error(
				`Command "${cmd.name}" from ${origin} conflicts with the one from ${other}. Choose a different name.`,
			);
		}
		if (seen.has(cmd.name)) {
			throw new Error(
				`Duplicate command name "${cmd.name}" in ${origin}. Each command must have a unique name.`,
			);
		}
		seen.add(cmd.name);
	}

	for (const cmd of newCommands) origins.set(cmd.name, origin);
	commands = [...commands, ...newCommands];
}

/**
 * Register the app's own commands (from its Bunary config).
 *
 * @param projectCommands - Array of project command definitions
 * @param origin - Config file they come from (for error messages)
 * @throws When a project command name collides with an existing command
 *
 * @example
 * ```ts
 * registerProjectCommands([
 *   { name: "db:seed", description: "Seed DB", category: "project", run: async () => {} },
 * ]);
 * ```
 */
export function registerProjectCommands(
	projectCommands: Command[],
	origin = "project commands",
): void {
	registerCommands(projectCommands, origin);
}

/**
 * Reset the registry to only built-in commands.
 *
 * @example
 * ```ts
 * resetRegistry(); // back to built-in commands only
 * ```
 */
export function resetRegistry(): void {
	commands = [...builtinCommands];
	origins.clear();
}

/**
 * Find a command by exact name.
 *
 * @param name - The command name to look up (e.g. "make:route")
 * @returns The matching command, or `undefined` if not found
 * @example
 * ```ts
 * const cmd = findCommand("init");
 * if (cmd) await cmd.run(["my-app"], {});
 * ```
 */
export function findCommand(name: string): Command | undefined {
	return commands.find((c) => c.name === name);
}

/**
 * Get all registered command names.
 *
 * Used by the suggestion engine and help output.
 *
 * @returns Array of command name strings
 * @example
 * ```ts
 * const names = getCommandNames();
 * // ["init", "make:route", "make:middleware", ...]
 * ```
 */
export function getCommandNames(): string[] {
	return commands.map((c) => c.name);
}
