/**
 * migrate commands tests (cwd is passed explicitly; process cwd is untouched)
 */
import { beforeEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	migrateDown,
	migrateStatus,
	migrateUp,
} from "../../src/commands/migration/runMigrations.js";
import { makeTempDir } from "../helpers/temp-dir.js";

describe("migrate commands", () => {
	let dir: string;

	beforeEach(async () => {
		dir = await makeTempDir("bunary-cli-migrate-test-");
		await writeFile(
			join(dir, "package.json"),
			JSON.stringify({
				name: "t",
				dependencies: { "@bunary/core": "^0", "@bunary/orm": "^0" },
			}),
		);
	});

	async function writeOrmConfig() {
		await mkdir(join(dir, "src", "config"), { recursive: true });
		await writeFile(join(dir, "src", "config", "orm.ts"), "export {};\n");
	}

	async function writeRunner(body: string) {
		await mkdir(join(dir, "scripts"), { recursive: true });
		await writeFile(join(dir, "scripts", "migrate.ts"), body);
	}

	it("errors before spawning when src/config/orm.ts is missing", async () => {
		await expect(migrateUp(dir)).rejects.toThrow(/src\/config\/orm\.ts/);
		expect(existsSync(join(dir, "scripts"))).toBe(false);
	});

	it("creates the runner and prints a message when missing", async () => {
		await writeOrmConfig();
		const log = spyOn(console, "log").mockImplementation(() => {});
		try {
			// The stub runs for real and fails (no @bunary/orm installed)
			await migrateStatus(dir).catch(() => {});
			expect(existsSync(join(dir, "scripts", "migrate.ts"))).toBe(true);
			expect(log).toHaveBeenCalledWith(
				expect.stringContaining("scripts/migrate.ts"),
			);
		} finally {
			log.mockRestore();
		}
	});

	it("does not announce or overwrite an existing runner", async () => {
		await writeOrmConfig();
		await writeRunner("process.exit(0);\n");
		const log = spyOn(console, "log").mockImplementation(() => {});
		try {
			await migrateUp(dir);
			expect(log).not.toHaveBeenCalled();
		} finally {
			log.mockRestore();
		}
	});

	it("passes the subcommand to the runner", async () => {
		await writeOrmConfig();
		await writeRunner('process.exit(process.argv[2] === "down" ? 0 : 9);\n');
		await migrateDown(dir);
		await expect(migrateUp(dir)).rejects.toThrow(/exit code 9/);
	});

	it("throws with context on non-zero exit", async () => {
		await writeOrmConfig();
		await writeRunner("process.exit(3);\n");
		await expect(migrateUp(dir)).rejects.toThrow(
			/migration runner failed \(up\).*exit code 3/s,
		);
	});
});
