/**
 * make:provider command tests
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	command,
	makeProvider,
} from "../../src/commands/provider/makeProvider.js";
import { makeTempDir } from "../helpers/temp-dir.js";

describe("make:provider", () => {
	let testDir: string;
	let originalCwd: string;
	const originalLog = console.log;

	beforeEach(async () => {
		originalCwd = process.cwd();
		testDir = await makeTempDir("bunary-cli-make-provider-test-");
		process.chdir(testDir);
		await writeFile(
			join(testDir, "package.json"),
			JSON.stringify({ name: "t", dependencies: { "@bunary/core": "^0" } }),
		);
		console.log = () => {};
	});

	afterEach(() => {
		console.log = originalLog;
		process.chdir(originalCwd);
	});

	const file = (name: string) =>
		readFileSync(join(testDir, "src", "providers", `${name}.ts`), "utf-8");

	it("creates src/providers/<name>.ts using defineProvider", async () => {
		await makeProvider("cache");
		const content = file("cache");
		expect(content).toContain('import { defineProvider } from "@bunary/core";');
		expect(content).toContain("export const cacheProvider = defineProvider({");
		expect(content).toContain('name: "cache"');
		expect(content).toContain("register(");
		expect(content).toContain("async boot(");
	});

	it("camel-cases multi-word names", async () => {
		await makeProvider("event-bus");
		expect(file("event-bus")).toContain("export const eventBusProvider =");
	});

	it("refuses to overwrite an existing file", async () => {
		await makeProvider("cache");
		await expect(makeProvider("cache")).rejects.toThrow("already exists");
	});

	it("registry definition runs the generator", async () => {
		await command.run(["queue"], {});
		expect(file("queue")).toContain("queueProvider");
	});
});
