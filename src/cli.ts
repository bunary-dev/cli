/**
 * The CLI runner. Side-effect free: nothing happens until {@link run} is
 * called (by `bin.ts`, or by a caller importing the package).
 *
 * Dispatches commands via the command registry. Each command is a
 * self-contained module — see src/types/command.ts for the interface
 * and src/registry.ts for the built-in list. At startup, commands from
 * installed `@bunary/*` packages and from the app's config are added.
 */

import { relative } from "node:path";
import { showCommandHelp, showHelp } from "./help.js";
import {
	findCommand,
	registerCommands,
	registerProjectCommands,
	resetRegistry,
} from "./registry.js";
import { dim, red } from "./utils/color.js";
import { loadPackageCommands } from "./utils/loadPackageCommands.js";
import {
	getProjectCommandsLoadError,
	loadProjectCommands,
	resolveConfigPath,
} from "./utils/loadProjectCommands.js";
import { parseFlags, validateFlags } from "./utils/parseFlags.js";
import { suggestCommand } from "./utils/suggest.js";
import { getVersion } from "./utils/version.js";

/** Commands removed or renamed in 1.0, with where to go instead. */
const REPLACED: Record<string, string> = {
	"route:make": "It was renamed to make:route.",
	"middleware:make": "It was renamed to make:middleware.",
	"model:make":
		"Models moved to @bunary/orm: install it and run bunary make:model.",
	"migration:make":
		"Migrations are handled by drizzle-kit: run bunx drizzle-kit generate (or bunary db:generate with @bunary/orm installed).",
	migrate:
		"Migrations are handled by drizzle-kit: run bunx drizzle-kit migrate (or bunary db:migrate with @bunary/orm installed).",
	"migrate:rollback":
		"Migrations are handled by drizzle-kit: see https://orm.drizzle.team/docs/kit-overview",
	"migrate:status":
		"Migrations are handled by drizzle-kit: see https://orm.drizzle.team/docs/kit-overview",
};

function message(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Register package-contributed and app commands for the project in `cwd`.
 *
 * A package whose commands collide is skipped with a warning, so a bad
 * dependency never breaks the built-ins; an app command that collides is
 * an error the user must fix.
 *
 * @returns `false` when an app command collides
 */
async function registerExternalCommands(cwd: string): Promise<boolean> {
	for (const { packageName, commands } of await loadPackageCommands(cwd)) {
		try {
			registerCommands(commands, packageName);
		} catch (error) {
			console.error(
				dim(
					`Warning: Ignoring CLI commands from ${packageName}: ${message(error)}`,
				),
			);
		}
	}

	let projectCommands: Awaited<ReturnType<typeof loadProjectCommands>> = [];
	try {
		projectCommands = await loadProjectCommands(cwd);
	} catch (error) {
		console.error(
			dim(`Warning: Failed to load project commands — ${message(error)}`),
		);
	}
	if (projectCommands.length > 0) {
		const configPath = resolveConfigPath(cwd);
		try {
			registerProjectCommands(
				projectCommands,
				configPath ? relative(cwd, configPath) : undefined,
			);
		} catch (error) {
			console.error(red(message(error)));
			return false;
		}
	}
	return true;
}

/**
 * Run the CLI with the given arguments.
 *
 * @param argv - Arguments after the executable, e.g. `["make:route", "users"]`
 * @returns The process exit code (0 on success)
 *
 * @example
 * ```ts
 * import { run } from "@bunary/cli";
 *
 * process.exitCode = await run(["init", "my-app", "--dry-run"]);
 * ```
 */
export async function run(argv: readonly string[]): Promise<number> {
	try {
		return await dispatch([...argv]);
	} catch (error) {
		console.error(red(message(error)));
		return 1;
	}
}

async function dispatch(rawArgs: string[]): Promise<number> {
	// Allow global switches before the command: `bunary --dry-run init my-app`
	const leading: string[] = [];
	while (rawArgs[0] === "--dry-run" || rawArgs[0] === "--verbose") {
		leading.push(rawArgs.shift() as string);
	}
	const args = [...rawArgs, ...leading];

	const cwd = process.cwd();
	resetRegistry();
	if (!(await registerExternalCommands(cwd))) return 1;

	if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
		showHelp();
		return 0;
	}

	if (args[0] === "--version" || args[0] === "-v") {
		console.log(`@bunary/cli v${getVersion()}`);
		return 0;
	}

	// Guarded above: args is non-empty here
	const commandName = args[0] as string;
	const command = findCommand(commandName);

	if (!command) {
		console.error(red(`Unknown command: ${commandName}`));
		const replaced = REPLACED[commandName];
		const suggestion = suggestCommand(commandName);
		if (replaced) {
			console.error(`\n  ${replaced}\n`);
		} else if (suggestion) {
			console.error(`\n  Did you mean: ${suggestion}?\n`);
		}
		const loadError = getProjectCommandsLoadError();
		if (loadError) {
			console.error(
				dim(
					`Your project config failed to load, so project commands are unavailable: ${loadError}`,
				),
			);
		}
		console.error(dim("Run bunary --help for all commands."));
		return 1;
	}

	// Per-command help, before flag validation (stop at a bare `--`)
	const rest = args.slice(1);
	const dashIdx = rest.indexOf("--");
	const optionArgs = dashIdx === -1 ? rest : rest.slice(0, dashIdx);
	if (optionArgs.includes("--help") || optionArgs.includes("-h")) {
		showCommandHelp(command.name);
		return 0;
	}

	const [positional, flags] = parseFlags(rest, command.flags);
	validateFlags(flags, command.flags);

	if (command.args) {
		for (const [i, arg] of command.args.entries()) {
			if (arg.required && !positional[i]) {
				console.error(red(`Error: ${arg.description} is required`));
				const argPlaceholders = command.args
					.map((a) => (a.required ? `<${a.name}>` : `[${a.name}]`))
					.join(" ");
				console.error(dim(`Usage: bunary ${command.name} ${argPlaceholders}`));
				return 1;
			}
		}
	}

	await command.run(positional, flags);
	return 0;
}
