#!/usr/bin/env bun
/**
 * @bunary/cli - CLI scaffolding tool for Bunary
 *
 * Dispatches commands via the command registry. Each command is a
 * self-contained module — see src/types/command.ts for the interface
 * and src/registry.ts for the full list.
 */

import { showHelp } from "./help.js";
import { findCommand } from "./registry.js";
import { dim, red } from "./utils/color.js";
import { parseFlags, validateFlags } from "./utils/parseFlags.js";
import { suggestCommand } from "./utils/suggest.js";
import { getVersion } from "./utils/version.js";

const args = process.argv.slice(2);

/**
 * Parse flags from the argument list.
 *
 * Extracts `--key value` pairs and returns the remaining positional args.
 *
 * @param argv - Raw CLI arguments after the command name
 * @returns Tuple of [positional args, parsed flags]
 */
function parseFlags(argv: string[]): [string[], Record<string, string>] {
	const positional: string[] = [];
	const flags: Record<string, string> = {};

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
