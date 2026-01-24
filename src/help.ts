/**
 * CLI help and usage information
 */

const CLI_NAME = "@bunary/cli";
const CLI_DESCRIPTION = "Bun-first backend platform inspired by Laravel";

interface Command {
	name: string;
	description: string;
	usage?: string;
}

const commands: Command[] = [
	{
		name: "init <name|.>",
		description: "Create a new Bunary project in a named directory or current directory",
		usage: "bunary init <name|.>",
	},
];

const options: Command[] = [
	{ name: "--help, -h", description: "Show this help message" },
	{ name: "--version, -v", description: "Show version" },
];

export function showHelp(): void {
	console.log(`
${CLI_NAME} - ${CLI_DESCRIPTION}

Usage:
  bunary <command> [options]

Commands:
${commands.map((cmd) => `  ${cmd.name.padEnd(18)} ${cmd.description}`).join("\n")}

Options:
${options.map((opt) => `  ${opt.name.padEnd(18)} ${opt.description}`).join("\n")}

Examples:
${commands
	.filter((cmd) => cmd.usage)
	.map((cmd) => `  ${cmd.usage}`)
	.join("\n")}
`);
}

export function showCommandHelp(command: string): void {
	const cmd = commands.find((c) => c.name.startsWith(command));
	if (cmd) {
		console.log(`\nUsage: bunary ${cmd.name}\n\n${cmd.description}\n`);
	} else {
		console.error(`Unknown command: ${command}`);
		showHelp();
	}
}
