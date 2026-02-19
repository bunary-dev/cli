#!/usr/bin/env bun
/**
 * @bunary/cli - CLI scaffolding tool for Bunary
 *
 * Dispatches commands via the command registry. Each command is a
 * self-contained module — see src/types/command.ts for the interface
 * and src/registry.ts for the full list.
 */

import { showHelp } from "./help.js";
import { findCommand, registerProjectCommands } from "./registry.js";
import { dim, red } from "./utils/color.js";
import { loadProjectCommands } from "./utils/loadProjectCommands.js";
import { parseFlags, validateFlags } from "./utils/parseFlags.js";
import { suggestCommand } from "./utils/suggest.js";
import { getVersion } from "./utils/version.js";

const args = process.argv.slice(2);

async function main(): Promise<void> {
	// Load project-level commands when inside a Bunary project
	let projectCommands: Awaited<ReturnType<typeof loadProjectCommands>> = [];
	try {
		projectCommands = await loadProjectCommands();
	} catch (error) {
		console.error(
			dim(
				`Warning: Failed to load project commands — ${error instanceof Error ? error.message : String(error)}`,
			),
		);
	}

	if (projectCommands.length > 0) {
		try {
			registerProjectCommands(projectCommands);
		} catch (error) {
			console.error(
				red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
	}

	if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
		showHelp();
		return;
	}

	if (args[0] === "--version" || args[0] === "-v") {
		console.log(`@bunary/cli v${getVersion()}`);
		return;
	}

	const command = findCommand(args[0]);

	if (!command) {
		console.error(red(`Unknown command: ${args[0]}`));
		const suggestion = suggestCommand(args[0]);
		if (suggestion) {
			console.error(`\n  Did you mean: ${suggestion}?\n`);
		}
		console.error(dim("Run bunary --help for all commands."));
		process.exit(1);
	}

	// Parse positional args and flags from remaining argv
	const [positional, flags] = parseFlags(args.slice(1));

	// Validate flags against command definitions
	if (command.flags) {
		try {
			validateFlags(flags, command.flags);
		} catch (error) {
			console.error(
				red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
	}

	// Validate required args
	if (command.args) {
		for (let i = 0; i < command.args.length; i++) {
			const arg = command.args[i];
			if (arg.required && !positional[i]) {
				console.error(red(`Error: ${arg.description} is required`));
				const argPlaceholders = command.args
					.map((a) => (a.required ? `<${a.name}>` : `[${a.name}]`))
					.join(" ");
				console.error(dim(`Usage: bunary ${command.name} ${argPlaceholders}`));
				process.exit(1);
			}
		}
	}

	try {
		await command.run(positional, flags);
	} catch (error) {
		console.error(red(error instanceof Error ? error.message : String(error)));
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(red(error instanceof Error ? error.message : String(error)));
	process.exit(1);
});
