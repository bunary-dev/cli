/**
 * Command registry — single source of truth for all CLI commands.
 *
 * Collects command definitions from each command module and provides
 * lookup helpers used by the dispatcher, help output, and suggestions.
 * Project-level commands can be merged in at runtime via
 * {@link registerProjectCommands}.
 *
 * @example
 * ```ts
 * import { commands, findCommand, getCommandNames } from "./registry.js";
 *
 * const cmd = findCommand("init");
 * if (cmd) await cmd.run(args, flags);
 * ```
 */

import { command as initCommand } from "./commands/init.js";
import { command as middlewareMakeCommand } from "./commands/middleware/makeMiddleware.js";
import { command as migrationMakeCommand } from "./commands/migration/makeMigration.js";
import {
	migrateCommand,
	migrateRollbackCommand,
	migrateStatusCommand,
} from "./commands/migration/runMigrations.js";
import { command as modelMakeCommand } from "./commands/model/makeModel.js";
import { command as routeMakeCommand } from "./commands/route/makeRoute.js";
import type { Command } from "./types/command.js";

/** Built-in commands that ship with the CLI. */
const builtinCommands: readonly Command[] = [
	initCommand,
	routeMakeCommand,
	middlewareMakeCommand,
	modelMakeCommand,
	migrationMakeCommand,
	migrateCommand,
	migrateRollbackCommand,
	migrateStatusCommand,
];

/** All registered CLI commands (built-in + project). */
export let commands: readonly Command[] = [...builtinCommands];

/**
 * Register project-level commands into the registry.
 *
 * Validates that no project command name collides with a built-in
 * command or another project command in the same batch.
 *
 * @param projectCommands - Array of project command definitions
 * @throws When a project command name collides with a built-in command
 * @throws When duplicate names exist in the project commands
 *
 * @example
 * ```ts
 * registerProjectCommands([
 *   { name: "db:seed", description: "Seed DB", category: "project", run: async () => {} },
 * ]);
 * ```
 */
export function registerProjectCommands(projectCommands: Command[]): void {
	if (projectCommands.length === 0) return;

	const builtinNames = new Set(builtinCommands.map((c) => c.name));
	const seen = new Set<string>();

	for (const cmd of projectCommands) {
		if (builtinNames.has(cmd.name)) {
			throw new Error(
				`Cannot override built-in command "${cmd.name}". Choose a different name for your project command.`,
			);
		}
		if (seen.has(cmd.name)) {
			throw new Error(
				`Duplicate command name "${cmd.name}" in project commands. Each command must have a unique name.`,
			);
		}
		seen.add(cmd.name);
	}

	commands = [...commands, ...projectCommands];
}

/**
 * Reset the registry to only built-in commands.
 *
 * Removes any project commands that were registered via
 * {@link registerProjectCommands}. Useful for testing.
 *
 * @example
 * ```ts
 * resetRegistry(); // back to built-in commands only
 * ```
 */
export function resetRegistry(): void {
	commands = [...builtinCommands];
}

/**
 * Find a command by exact name.
 *
 * @param name - The command name to look up (e.g. "route:make")
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
 * // ["init", "route:make", "middleware:make", ...]
 * ```
 */
export function getCommandNames(): string[] {
	return commands.map((c) => c.name);
}
