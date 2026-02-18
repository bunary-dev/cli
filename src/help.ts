/**
 * CLI help and usage information — auto-generated from the command registry.
 */

import { commands } from "./registry.js";
import type { Command, CommandCategory } from "./types/command.js";
import { bold, cyan, dim } from "./utils/color.js";

const CLI_DESCRIPTION = "Bun-first backend platform inspired by Laravel";

/** Column width for command names — keeps descriptions aligned. */
const CMD_COL = 26;

/** Display order for help sections. */
const CATEGORY_LABELS: Record<CommandCategory, string> = {
	scaffold: "Scaffold",
	database: "Database",
};

/** Ordered list of categories to display. */
const CATEGORY_ORDER: CommandCategory[] = ["scaffold", "database"];

/** Built-in global options shown in every help output. */
const builtinOptions = [
	{ flags: "--help, -h", description: "Show this help" },
	{ flags: "--version, -v", description: "Show version" },
];

/**
 * Build the Options section from built-in globals + all command flag
 * definitions in the registry. This removes the need to maintain a
 * separate hardcoded list — adding a flag to a command definition
 * automatically updates the help output.
 */
function buildGlobalOptions(): { flags: string; description: string }[] {
	const options = [...builtinOptions];

	for (const cmd of commands) {
		if (!cmd.flags) continue;
		for (const flag of cmd.flags) {
			const valueHint = flag.values ? ` ${flag.values.join("|")}` : "";
			options.push({
				flags: `${flag.name}${valueHint}`,
				description: `${flag.description} (${cmd.name} only)`,
			});
		}
	}

	return options;
}

function formatCommandLine(cmd: Command): string {
	const argsStr = cmd.args
		? cmd.args
				.map((a) => (a.required ? `<${a.name}>` : `[${a.name}]`))
				.join(" ")
		: undefined;

	const label = argsStr ? `${cyan(cmd.name)} ${dim(argsStr)}` : cyan(cmd.name);

	// For padding we need the "visual" length (without ANSI codes)
	const visualLen = cmd.name.length + (argsStr ? 1 + argsStr.length : 0);
	const padding = " ".repeat(Math.max(1, CMD_COL - visualLen));

	return `    ${label}${padding}${cmd.description}`;
}

/**
 * Show the full CLI help output.
 *
 * Sections and commands are auto-generated from the command registry,
 * so adding a new command to the registry automatically updates help.
 *
 * @example
 * ```ts
 * showHelp(); // prints grouped help to stdout
 * ```
 */
export function showHelp(): void {
	const lines: string[] = [
		"",
		`  ${bold("bunary")} ${dim("—")} ${CLI_DESCRIPTION}`,
		"",
		`  ${bold("Usage:")}  bunary ${dim("<command>")} ${dim("[options]")}`,
		"",
	];

	for (const category of CATEGORY_ORDER) {
		const sectionCommands = commands.filter((c) => c.category === category);
		if (sectionCommands.length === 0) continue;

		lines.push(`  ${bold(CATEGORY_LABELS[category])}`);
		for (const cmd of sectionCommands) {
			lines.push(formatCommandLine(cmd));
		}
		lines.push("");
	}

	const globalOptions = buildGlobalOptions();

	lines.push(`  ${bold("Options")}`);
	for (const opt of globalOptions) {
		const padding = " ".repeat(Math.max(1, CMD_COL - opt.flags.length));
		lines.push(`    ${dim(opt.flags)}${padding}${opt.description}`);
	}
	lines.push("");

	console.log(lines.join("\n"));
}

/**
 * Show help for a specific command.
 *
 * @param commandName - The command name to show help for
 * @example
 * ```ts
 * showCommandHelp("route:make");
 * ```
 */
export function showCommandHelp(commandName: string): void {
	const cmd = commands.find((c) => c.name === commandName);
	if (cmd) {
		const argsStr = cmd.args
			? cmd.args
					.map((a) => (a.required ? `<${a.name}>` : `[${a.name}]`))
					.join(" ")
			: undefined;
		const usage = argsStr
			? `bunary ${cyan(cmd.name)} ${dim(argsStr)}`
			: `bunary ${cyan(cmd.name)}`;
		console.log(`\n  ${bold("Usage:")} ${usage}\n\n  ${cmd.description}\n`);
	} else {
		console.error(`Unknown command: ${commandName}`);
		showHelp();
	}
}
