/**
 * Integration tests: verify make commands print next steps after creation
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeMiddleware } from "../../src/commands/middleware/makeMiddleware.js";
import { makeModel } from "../../src/commands/model/makeModel.js";
import { makeRoute } from "../../src/commands/route/makeRoute.js";

describe("make commands show next steps", () => {
	let testDir: string;
	let originalCwd: string;
	let logOutput: string[];
	const originalLog = console.log;

	beforeEach(async () => {
		originalCwd = process.cwd();
		testDir = await mkdtemp(join(tmpdir(), "bunary-cli-next-steps-test-"));
		process.chdir(testDir);

		const packageJson = {
			name: "test-project",
			dependencies: { "@bunary/core": "^0.0.5" },
		};
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);
		await mkdir(join(testDir, "src"), { recursive: true });

		logOutput = [];
		console.log = (...args: unknown[]) => {
			logOutput.push(args.map(String).join(" "));
		};
	});

	afterEach(async () => {
		console.log = originalLog;
		try {
			if (originalCwd && existsSync(originalCwd)) {
				process.chdir(originalCwd);
			}
		} catch {
			// ignore
		}
		if (testDir) {
			try {
				await rm(testDir, { recursive: true, force: true });
			} catch {
				// ignore
			}
		}
	});

	it("route:make shows next steps with import and registration", async () => {
		await makeRoute("users");
		const output = logOutput.join("\n");
		expect(output).toContain("Next:");
		expect(output).toContain("registerUsers");
		expect(output).toContain("src/routes/index.ts");
	});

	it("middleware:make shows next steps with import and app.use()", async () => {
		await makeMiddleware("ensure-auth");
		const output = logOutput.join("\n");
		expect(output).toContain("Next:");
		expect(output).toContain("ensureAuthMiddleware");
		expect(output).toContain("app.use(");
	});

	it("model:make shows next steps with import and usage", async () => {
		await makeModel("users");
		const output = logOutput.join("\n");
		expect(output).toContain("Next:");
		expect(output).toContain("Users");
		expect(output).toContain("import");
	});
});
