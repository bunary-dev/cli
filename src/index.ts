#!/usr/bin/env bun
/**
 * @bunary/cli - CLI scaffolding tool for Bunary
 *
 * Usage:
 *   bunary init <name>  - Create a new project in <name> directory
 *   bunary init .       - Create a new project in current directory
 *   bunary --help       - Show help
 *   bunary --version    - Show version
 */

import { init } from "./commands/init.js";
import { showHelp } from "./help.js";

const VERSION = "0.0.1";
const args = process.argv.slice(2);

async function main(): Promise<void> {
	if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
		showHelp();
		return;
	}

	if (args[0] === "--version" || args[0] === "-v") {
		console.log(`@bunary/cli v${VERSION}`);
		return;
	}

	if (args[0] === "init") {
		const name = args[1];
		if (!name) {
			console.error("Error: Project name is required");
			console.error("Usage: bunary init <name>");
			process.exit(1);
		}
		await init(name);
		return;
	}

	console.error(`Unknown command: ${args[0]}`);
	showHelp();
	process.exit(1);
}

main().catch((error) => {
	console.error("Error:", error.message);
	process.exit(1);
});
