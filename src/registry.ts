/**
 * Command registry — single source of truth for all CLI commands.
 *
 * Collects command definitions from each command module and provides
 * lookup helpers used by the dispatcher, help output, and suggestions.
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

/** All registered CLI commands. */
export const commands: readonly Command[] = [
	initCommand,
	routeMakeCommand,
	middlewareMakeCommand,
	modelMakeCommand,
	migrationMakeCommand,
	migrateCommand,
	migrateRollbackCommand,
	migrateStatusCommand,
];

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
