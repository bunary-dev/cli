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

const VERSION = "0.0.12";
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
			console.error(
				"Usage: bunary init <name> [--auth basic|jwt] [--umbrella]  (or 'bunary init .' for current directory)",
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
		const umbrella = args.includes("--umbrella");
		await init(name, { auth, umbrella });
		return;
	}

	if (args[0] === "model:make") {
		const tableName = args[1];
		if (!tableName) {
			console.error("Error: Table name is required");
			console.error("Usage: bunary model:make <table-name>");
			process.exit(1);
		}
		try {
			await makeModel(tableName);
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
		return;
	}

	if (args[0] === "middleware:make") {
		const middlewareName = args[1];
		if (!middlewareName) {
			console.error("Error: Middleware name is required");
			console.error("Usage: bunary middleware:make <name>");
			process.exit(1);
		}
		try {
			await makeMiddleware(middlewareName);
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
		return;
	}

	if (args[0] === "migration:make") {
		const migrationName = args[1];
		if (!migrationName) {
			console.error("Error: Migration name is required");
			console.error(
				"Usage: bunary migration:make <name>  (e.g. create_users_table)",
			);
			process.exit(1);
		}
		try {
			await makeMigration(migrationName);
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
		return;
	}

	if (args[0] === "migrate") {
		try {
			await migrateUp();
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
		return;
	}

	if (args[0] === "migrate:rollback") {
		try {
			await migrateDown();
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
		return;
	}

	if (args[0] === "migrate:status") {
		try {
			await migrateStatus();
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
		return;
	}

	if (args[0] === "route:make") {
		const routeName = args[1];
		if (!routeName) {
			console.error("Error: Route name is required");
			console.error("Usage: bunary route:make <name>");
			process.exit(1);
		}
		try {
			await makeRoute(routeName);
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
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
