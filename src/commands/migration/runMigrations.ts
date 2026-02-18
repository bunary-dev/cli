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
	return runnerPath;
}

/**
 * Run migrate runner script with given command (up, down, status).
 */
async function runMigrateScript(
	cwd: string,
	cmd: "up" | "down" | "status",
): Promise<void> {
	ensureOrmDependency(cwd);

	await ensureMigrateRunner(cwd);

	const scriptPath = join(cwd, "scripts", "migrate.ts");
	const proc = Bun.spawn(["bun", "run", scriptPath, cmd], {
		cwd,
		stdout: "inherit",
		stderr: "inherit",
		stdin: "inherit",
	});
	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		process.exit(exitCode);
	}
}

export async function migrateUp(): Promise<void> {
	await runMigrateScript(process.cwd(), "up");
}

export async function migrateDown(): Promise<void> {
	await runMigrateScript(process.cwd(), "down");
}

export async function migrateStatus(): Promise<void> {
	await runMigrateScript(process.cwd(), "status");
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
