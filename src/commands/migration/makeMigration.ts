/**
 * migration:make command - create a new migration file (Laravel-inspired)
 */
import { existsSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "../../types/command.js";
import { cyan, dim, green } from "../../utils/color.js";
import {
	type DryRunOptions,
	dryRunFlags,
	dryRunOptionsFromFlags,
	reportDryRun,
} from "../../utils/dryRun.js";
import { migrationNextSteps } from "../../utils/nextSteps.js";
import { loadStub } from "../../utils/stub.js";
import {
	assertInsideDir,
	ensureOrmDependency,
} from "../../utils/validation.js";

/**
 * Normalise a migration name to snake_case [a-z0-9_].
 * Spaces and hyphens become underscores; path separators and any other
 * characters are rejected.
 *
 * @throws Error if the name is empty or contains invalid characters
 */
export function normalizeMigrationName(name: string): string {
	const normalized = name
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, "_");
	if (!/^[a-z0-9_]+$/.test(normalized)) {
		throw new Error(
			`Error: Invalid migration name "${name}". Use only letters, numbers and underscores (e.g. create_users_table).`,
		);
	}
	return normalized;
}

/**
 * Derive a suggested table name from migration name (e.g. create_users_table -> users).
 * The result is always a valid identifier.
 */
export function migrationNameToTableName(name: string): string {
	const lower = name.toLowerCase();
	const createMatch = /^create_(.+)_table$/.exec(lower);
	const addMatch = /^add_.+_to_(.+)$/.exec(lower);
	const raw = (createMatch?.[1] ?? addMatch?.[1] ?? lower)
		.replace(/[^a-z0-9_]+/g, "_")
		.replace(/^_+|_+$/g, "");
	if (raw === "") return "migrations";
	return /^[a-z_]/.test(raw) ? raw : `_${raw}`;
}

const TIMESTAMP_RE = /^(\d{14})_(.+)\.ts$/;

function formatTimestamp(date: Date): string {
	return date.toISOString().replace(/[-:T]/g, "").slice(0, 14);
}

function parseTimestamp(ts: string): Date {
	return new Date(
		Date.UTC(
			+ts.slice(0, 4),
			+ts.slice(4, 6) - 1,
			+ts.slice(6, 8),
			+ts.slice(8, 10),
			+ts.slice(10, 12),
			+ts.slice(12, 14),
		),
	);
}

/**
 * Generate a migration file in ./migrations (Laravel-style: timestamp_name.ts).
 *
 * @param name - Migration name (e.g. create_users_table, add_slug_to_posts)
 * @throws Error if not in a Bunary project, project missing @bunary/orm, or file exists
 */
export async function makeMigration(
	name: string,
	options: DryRunOptions = {},
): Promise<void> {
	const cwd = process.cwd();
	ensureOrmDependency(cwd);

	name = normalizeMigrationName(name);
	const migrationsDir = join(cwd, "migrations");

	let latest = "";
	if (existsSync(migrationsDir)) {
		for (const file of readdirSync(migrationsDir)) {
			const match = TIMESTAMP_RE.exec(file);
			if (!match) continue;
			if (match[2] === name) {
				throw new Error(
					`Error: Migration ${name} already exists at ${join(migrationsDir, file)}\nDelete the existing file if you want to regenerate it.`,
				);
			}
			if ((match[1] as string) > latest) latest = match[1] as string;
		}
	}

	// One-second resolution: bump past the latest existing migration so
	// creation order always matches sort order.
	let timestamp = formatTimestamp(new Date());
	if (latest !== "" && timestamp <= latest) {
		timestamp = formatTimestamp(
			new Date(parseTimestamp(latest).getTime() + 1000),
		);
	}
	const migrationPath = join(migrationsDir, `${timestamp}_${name}.ts`);
	assertInsideDir(migrationsDir, migrationPath);

	const tableName = migrationNameToTableName(name);
	const content = await loadStub("migration/make.ts", {
		tableName,
	});

	if (options.dryRun) {
		reportDryRun([{ path: migrationPath, content }], cwd, options.verbose);
		return;
	}

	await mkdir(migrationsDir, { recursive: true });

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
	flags: dryRunFlags,
	async run(args, flags) {
		await makeMigration(args[0] as string, dryRunOptionsFromFlags(flags));
	},
};
