/**
 * CLI help and usage information
 */

import { bold, cyan, dim } from "./utils/color.js";

const CLI_DESCRIPTION = "Bun-first backend platform inspired by Laravel";

/** Column width for command names — keeps descriptions aligned. */
const CMD_COL = 26;

interface HelpCommand {
	name: string;
	args?: string;
	description: string;
}

interface HelpSection {
	title: string;
	commands: HelpCommand[];
}

const sections: HelpSection[] = [
	{
		title: "Scaffold",
		commands: [
			{
				name: "init",
				args: "<name|.>",
				description: "Create a new project",
			},
			{
				name: "route:make",
				args: "<name>",
				description: "Generate a route module",
			},
			{
				name: "middleware:make",
				args: "<name>",
				description: "Generate a middleware",
			},
			{
				name: "model:make",
				args: "<table>",
				description: "Generate an ORM model",
			},
		],
	},
	{
		title: "Database",
		commands: [
			{
				name: "migration:make",
				args: "<name>",
				description: "Create a migration",
			},
			{ name: "migrate", description: "Run pending migrations" },
			{
				name: "migrate:rollback",
				description: "Rollback last batch",
			},
			{
				name: "migrate:status",
				description: "Show migration status",
			},
		],
	},
];

const globalOptions = [
	{ flags: "--help, -h", description: "Show this help" },
	{ flags: "--version, -v", description: "Show version" },
	{
		flags: "--auth basic|jwt",
		description: "Auth scaffolding (init only)",
	},
];

function formatCommandLine(cmd: HelpCommand): string {
	const label = cmd.args
		? `${cyan(cmd.name)} ${dim(cmd.args)}`
		: cyan(cmd.name);

	// For padding we need the "visual" length (without ANSI codes)
	const visualLen = cmd.name.length + (cmd.args ? 1 + cmd.args.length : 0);
	const padding = " ".repeat(Math.max(1, CMD_COL - visualLen));

	return `    ${label}${padding}${cmd.description}`;
}

export function showHelp(): void {
	const lines: string[] = [
		"",
		`  ${bold("bunary")} ${dim("—")} ${CLI_DESCRIPTION}`,
		"",
		`  ${bold("Usage:")}  bunary ${dim("<command>")} ${dim("[options]")}`,
		"",
	];

	for (const section of sections) {
		lines.push(`  ${bold(section.title)}`);
		for (const cmd of section.commands) {
			lines.push(formatCommandLine(cmd));
		}
		lines.push("");
	}

	lines.push(`  ${bold("Options")}`);
	for (const opt of globalOptions) {
		const padding = " ".repeat(Math.max(1, CMD_COL - opt.flags.length));
		lines.push(`    ${dim(opt.flags)}${padding}${opt.description}`);
	}
	lines.push("");

	console.log(lines.join("\n"));
}

export function showCommandHelp(command: string): void {
	const allCommands = sections.flatMap((s) => s.commands);
	const cmd = allCommands.find((c) => c.name === command);
	if (cmd) {
		const usage = cmd.args
			? `bunary ${cyan(cmd.name)} ${dim(cmd.args)}`
			: `bunary ${cyan(cmd.name)}`;
		console.log(`\n  ${bold("Usage:")} ${usage}\n\n  ${cmd.description}\n`);
	} else {
		console.error(`Unknown command: ${command}`);
		showHelp();
	}
}
