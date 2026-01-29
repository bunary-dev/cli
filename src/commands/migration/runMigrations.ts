/**
 * migrate, migrate:rollback, migrate:status - run migrations (Laravel-inspired)
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getStubsDir } from "../../utils/stub.js";
import { isBunaryProject } from "../../utils/validation.js";

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
	if (!isBunaryProject(cwd)) {
		throw new Error(
			"Error: Not in a Bunary project.\n" +
				"Make sure you're in a directory with package.json containing @bunary/core dependency.",
		);
	}

	const pkgPath = join(cwd, "package.json");
	const pkg = JSON.parse(await Bun.file(pkgPath).text()) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const hasOrm =
		pkg.dependencies?.["@bunary/orm"] || pkg.devDependencies?.["@bunary/orm"];
	if (!hasOrm) {
		throw new Error(
			"Error: Project must have @bunary/orm in dependencies.\n" +
				"Run: bun add @bunary/orm",
		);
	}

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
