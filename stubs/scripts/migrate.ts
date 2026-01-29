/**
 * Migration runner - load ORM config and run migrate up/down/status.
 * Run with: bun run scripts/migrate.ts [up|down|status]
 *
 * Ensure src/config/orm.ts exists and calls setOrmConfig(defineOrmConfig({ ... })).
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

// Load project ORM config (must call setOrmConfig)
try {
	await import(pathToFileURL(join(root, "src", "config", "orm.ts")).href);
} catch (err) {
	console.error(
		"Error: Could not load ORM config. Create src/config/orm.ts that calls setOrmConfig(defineOrmConfig({ database: { ... } })).",
	);
	console.error(err);
	process.exit(1);
}

const { createMigrator } = await import("@bunary/orm");

const cmd = process.argv[2] ?? "status";
const migrationsPath = join(root, "migrations");
const migrator = createMigrator({ migrationsPath });

if (cmd === "up") {
	await migrator.up();
	console.log("Migrations complete.");
} else if (cmd === "down") {
	await migrator.down();
	console.log("Rollback complete.");
} else if (cmd === "status") {
	const s = await migrator.status();
	console.log("Ran:", s.ran.length);
	for (const n of s.ran) {
		console.log("  -", n);
	}
	console.log("Pending:", s.pending.length);
	for (const n of s.pending) {
		console.log("  -", n);
	}
} else {
	console.error("Usage: bun run scripts/migrate.ts [up|down|status]");
	process.exit(1);
}
