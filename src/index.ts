#!/usr/bin/env bun
/**
 * @bunary/cli - CLI scaffolding tool for Bunary
 *
 * Usage:
 *   bunary init <name>        - Create a new project in <name> directory
 *   bunary init <name> --auth basic|jwt - Scaffold with Basic or JWT auth
 *   bunary init .             - Create a new project in current directory
 *   bunary model:make <table>     - Generate an ORM model for <table>
 *   bunary middleware:make <name> - Generate a middleware in src/middleware/
 *   bunary migration:make <name>  - Create a migration in ./migrations/
 *   bunary migrate                - Run pending migrations
 *   bunary migrate:rollback      - Rollback last migration batch
 *   bunary migrate:status        - Show migration status
 *   bunary route:make <name>     - Generate a route module in src/routes/
 *   bunary --help             - Show help
 *   bunary --version          - Show version
 */

import { init } from "./commands/init.js";
import { makeMiddleware } from "./commands/middleware/makeMiddleware.js";
import { makeMigration } from "./commands/migration/makeMigration.js";
import {
	migrateDown,
	migrateStatus,
	migrateUp,
} from "./commands/migration/runMigrations.js";
import { makeModel } from "./commands/model/makeModel.js";
import { makeRoute } from "./commands/route/makeRoute.js";
import { showHelp } from "./help.js";
import { dim, red } from "./utils/color.js";
import { getVersion } from "./utils/version.js";

const args = process.argv.slice(2);

async function main(): Promise<void> {
	if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
		showHelp();
		return;
	}

	if (args[0] === "--version" || args[0] === "-v") {
		console.log(`@bunary/cli v${getVersion()}`);
		return;
	}

	if (args[0] === "init") {
		const name = args[1];
		if (!name) {
			console.error(red("Error: Project name is required"));
			console.error(
				dim(
					"Usage: bunary init <name> [--auth basic|jwt]  (or 'bunary init .' for current directory)",
				),
			);
			process.exit(1);
		}
		let auth: "basic" | "jwt" | undefined;
		const authIdx = args.indexOf("--auth");
		if (authIdx !== -1 && args[authIdx + 1]) {
			const value = args[authIdx + 1];
			if (value === "basic" || value === "jwt") {
				auth = value;
			}
		}
		await init(name, { auth });
		return;
	}

	if (args[0] === "model:make") {
		const tableName = args[1];
		if (!tableName) {
			console.error(red("Error: Table name is required"));
			console.error(dim("Usage: bunary model:make <table>"));
			process.exit(1);
		}
		try {
			await makeModel(tableName);
		} catch (error) {
			console.error(
				red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
		return;
	}

	if (args[0] === "middleware:make") {
		const middlewareName = args[1];
		if (!middlewareName) {
			console.error(red("Error: Middleware name is required"));
			console.error(dim("Usage: bunary middleware:make <name>"));
			process.exit(1);
		}
		try {
			await makeMiddleware(middlewareName);
		} catch (error) {
			console.error(
				red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
		return;
	}

	if (args[0] === "migration:make") {
		const migrationName = args[1];
		if (!migrationName) {
			console.error(red("Error: Migration name is required"));
			console.error(
				dim("Usage: bunary migration:make <name>  (e.g. create_users_table)"),
			);
			process.exit(1);
		}
		try {
			await makeMigration(migrationName);
		} catch (error) {
			console.error(
				red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
		return;
	}

	if (args[0] === "migrate") {
		try {
			await migrateUp();
		} catch (error) {
			console.error(
				red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
		return;
	}

	if (args[0] === "migrate:rollback") {
		try {
			await migrateDown();
		} catch (error) {
			console.error(
				red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
		return;
	}

	if (args[0] === "migrate:status") {
		try {
			await migrateStatus();
		} catch (error) {
			console.error(
				red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
		return;
	}

	if (args[0] === "route:make") {
		const routeName = args[1];
		if (!routeName) {
			console.error(red("Error: Route name is required"));
			console.error(dim("Usage: bunary route:make <name>"));
			process.exit(1);
		}
		try {
			await makeRoute(routeName);
		} catch (error) {
			console.error(
				red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
		return;
	}

	console.error(red(`Unknown command: ${args[0]}`));
	console.error(dim("Run bunary --help for all commands."));
	process.exit(1);
}

main().catch((error) => {
	console.error(red(error instanceof Error ? error.message : String(error)));
	process.exit(1);
});
