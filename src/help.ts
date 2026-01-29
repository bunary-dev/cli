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

interface Option {
	name: string;
	alias: string;
	description: string;
}

const commands: Command[] = [
	{
		name: "init <name|.> [--auth basic|jwt]",
		description:
			"Create a new Bunary project (optionally with Basic or JWT auth scaffolding)",
		usage: "bunary init <name|.> [--auth basic|jwt]",
	},
	{
		name: "model:make <table-name>",
		description: "Generate an ORM model class for the given table name",
		usage: "bunary model:make <table-name>",
	},
	{
		name: "route:make <name>",
		description: "Generate a route module in src/routes/",
		usage: "bunary route:make <name>",
	},
];

const options: Option[] = [
	{ name: "--help", alias: "-h", description: "Show this help message" },
	{ name: "--version", alias: "-v", description: "Show version" },
];

export function showHelp(): void {
	console.log(`
${CLI_NAME} - ${CLI_DESCRIPTION}

Usage:
  bunary <command> [options]

Commands:
${commands.map((cmd) => `  ${cmd.name.padEnd(18)} ${cmd.description}`).join("\n")}

Options:
${options.map((opt) => `  ${opt.name}, ${opt.alias}`.padEnd(20) + opt.description).join("\n")}

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
