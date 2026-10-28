/**
 * Integration tests: verify make commands print next steps after creation
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeCommand } from "../../src/commands/command/makeCommand.js";
import { makeMiddleware } from "../../src/commands/middleware/makeMiddleware.js";
import { makeProvider } from "../../src/commands/provider/makeProvider.js";
import { makeRoute } from "../../src/commands/route/makeRoute.js";
import { makeTempDir } from "../helpers/temp-dir.js";

describe("make commands show next steps", () => {
	let testDir: string;
	let originalCwd: string;
	let logOutput: string[];
	const originalLog = console.log;

	beforeEach(async () => {
		originalCwd = process.cwd();
		testDir = await makeTempDir("bunary-cli-next-steps-test-");
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

	afterEach(() => {
		console.log = originalLog;
		try {
			if (originalCwd && existsSync(originalCwd)) {
				process.chdir(originalCwd);
			}
		} catch {
			// ignore
		}
	});

	it("make:route shows next steps with import and registration", async () => {
		await makeRoute("users");
		const output = logOutput.join("\n");
		expect(output).toContain("Next:");
		expect(output).toContain("registerUsers");
		expect(output).toContain("src/routes/index.ts");
	});

	it("make:middleware shows next steps with import and app.use()", async () => {
		await makeMiddleware("ensure-auth");
		const output = logOutput.join("\n");
		expect(output).toContain("Next:");
		expect(output).toContain("ensureAuthMiddleware");
		expect(output).toContain("app.use(");
	});

	it("make:command shows how to register the command", async () => {
		await makeCommand("send-emails");
		const output = logOutput.join("\n");
		expect(output).toContain("Next:");
		expect(output).toContain("sendEmailsCommand");
		expect(output).toContain("config/bunary.ts");
	});

	it("make:provider shows how to register the provider", async () => {
		await makeProvider("cache");
		const output = logOutput.join("\n");
		expect(output).toContain("Next:");
		expect(output).toContain("cacheProvider");
		expect(output).toContain("providers:");
	});
});
