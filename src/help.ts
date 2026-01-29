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
		name: "init <name|.> [--auth basic|jwt] [--umbrella]",
		description:
			"Create a new Bunary project (optionally with Basic or JWT auth; --umbrella uses bunary package instead of @bunary/*)",
		usage: "bunary init <name|.> [--auth basic|jwt] [--umbrella]",
	},
	{
		name: "model:make <table-name>",
		description: "Generate an ORM model class for the given table name",
		usage: "bunary model:make <table-name>",
	},
	{
		name: "make:middleware <name>",
		description: "Generate a middleware in src/middleware/ (Laravel-inspired)",
		usage: "bunary make:middleware <name>",
	},
	{
		name: "make:migration <name>",
		description: "Create a migration in ./migrations/ (Laravel-inspired)",
		usage: "bunary make:migration <name>",
	},
	{
		name: "migrate",
		description: "Run pending migrations",
		usage: "bunary migrate",
	},
	{
		name: "migrate:rollback",
		description: "Rollback last migration batch",
		usage: "bunary migrate:rollback",
	},
	{
		name: "migrate:status",
		description: "Show migration status (ran / pending)",
		usage: "bunary migrate:status",
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
