/**
 * migrate, migrate:rollback, migrate:status - run migrations (Laravel-inspired)
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "../../types/command.js";
import { getStubsDir } from "../../utils/stub.js";
import { ensureOrmDependency } from "../../utils/validation.js";

/**
 * Ensure scripts/migrate.ts exists in project; create from stub if missing.
 */
async function ensureMigrateRunner(cwd: string): Promise<string> {
	const scriptsDir = join(cwd, "scripts");
	const runnerPath = join(scriptsDir, "migrate.ts");
	if (existsSync(runnerPath)) {
		return runnerPath;
	}
	const stubsDir = getStubsDir();
	const runnerStub = await Bun.file(
		join(stubsDir, "scripts", "migrate.ts"),
	).text();
	await mkdir(scriptsDir, { recursive: true });
	await Bun.write(runnerPath, runnerStub);
	console.log("Created scripts/migrate.ts (migration runner)");
	return runnerPath;
}

/**
 * Run migrate runner script with given command (up, down, status).
 *
 * @throws When the ORM config is missing or the runner exits non-zero
 */
async function runMigrateScript(
	cwd: string,
	cmd: "up" | "down" | "status",
): Promise<void> {
	ensureOrmDependency(cwd);

	if (!existsSync(join(cwd, "src", "config", "orm.ts"))) {
		throw new Error(
			"Error: src/config/orm.ts not found.\n" +
				"Create it and call setOrmConfig(defineOrmConfig({ database: { ... } })).",
		);
	}

	const scriptPath = await ensureMigrateRunner(cwd);
	const proc = Bun.spawn([process.execPath, "run", scriptPath, cmd], {
		cwd,
		stdout: "inherit",
		stderr: "inherit",
		stdin: "inherit",
	});
	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		throw new Error(
			`Error: migration runner failed (${cmd}) with exit code ${exitCode}.\n` +
				`Script: ${scriptPath}`,
		);
	}
}

export async function migrateUp(cwd: string = process.cwd()): Promise<void> {
	await runMigrateScript(cwd, "up");
}

export async function migrateDown(cwd: string = process.cwd()): Promise<void> {
	await runMigrateScript(cwd, "down");
}

export async function migrateStatus(
	cwd: string = process.cwd(),
): Promise<void> {
	await runMigrateScript(cwd, "status");
}

/** Command definition for `migrate`. */
export const migrateCommand: Command = {
	name: "migrate",
	description: "Run pending migrations",
	category: "database",
	async run() {
		await migrateUp();
	},
};

/** Command definition for `migrate:rollback`. */
export const migrateRollbackCommand: Command = {
	name: "migrate:rollback",
	description: "Rollback last batch",
	category: "database",
	async run() {
		await migrateDown();
	},
};

/** Command definition for `migrate:status`. */
export const migrateStatusCommand: Command = {
	name: "migrate:status",
	description: "Show migration status",
	category: "database",
	async run() {
		await migrateStatus();
	},
};
