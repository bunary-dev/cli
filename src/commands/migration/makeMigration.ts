/**
 * migration:make command - create a new migration file (Laravel-inspired)
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "../../types/command.js";
import { cyan, dim, green } from "../../utils/color.js";
import { migrationNextSteps } from "../../utils/nextSteps.js";
import { loadStub } from "../../utils/stub.js";
import { ensureOrmDependency } from "../../utils/validation.js";

/**
 * Derive a suggested table name from migration name (e.g. create_users_table -> users).
 */
function migrationNameToTableName(name: string): string {
	const lower = name.toLowerCase();
	const createMatch = /^create_(.+)_table$/.exec(lower);
	if (createMatch) return createMatch[1];
	const addMatch = /^add_.+_to_(.+)$/.exec(lower);
	if (addMatch) return addMatch[1];
	// default: use name with underscores as table name
	return lower.replace(/-/g, "_");
}

/**
 * Generate a migration file in ./migrations (Laravel-style: timestamp_name.ts).
 *
 * @param name - Migration name (e.g. create_users_table, add_slug_to_posts)
 * @throws Error if not in a Bunary project, project missing @bunary/orm, or file exists
 */
export async function makeMigration(name: string): Promise<void> {
	const cwd = process.cwd();
	ensureOrmDependency(cwd);

	const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
	const fileName = `${timestamp}_${name}.ts`;
	const migrationsDir = join(cwd, "migrations");
	const migrationPath = join(migrationsDir, fileName);

	if (existsSync(migrationPath)) {
		throw new Error(
			`Error: Migration ${name} already exists at ${migrationPath}\nDelete the existing file if you want to regenerate it.`,
		);
	}

	await mkdir(migrationsDir, { recursive: true });

	const tableName = migrationNameToTableName(name);
	const content = await loadStub("migration/make.ts", {
		tableName,
	});

	await writeFile(migrationPath, content, "utf-8");

	console.log(green(`✅ Created migration: ${cyan(migrationPath)}`));
	console.log(dim(migrationNextSteps()));
}

/** Command definition for the registry. */
export const command: Command = {
	name: "migration:make",
	description: "Create a migration",
	category: "database",
	args: [
		{
			name: "name",
			required: true,
			description: "Migration name (e.g. create_users_table)",
		},
	],
	async run(args) {
		await makeMigration(args[0]);
	},
};
