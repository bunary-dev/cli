/**
 * make:command command tests
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	command,
	makeCommand,
} from "../../src/commands/command/makeCommand.js";
import { makeTempDir } from "../helpers/temp-dir.js";

describe("make:command", () => {
	let testDir: string;
	let originalCwd: string;
	const originalLog = console.log;

	beforeEach(async () => {
		originalCwd = process.cwd();
		testDir = await makeTempDir("bunary-cli-make-command-test-");
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
		readFileSync(join(testDir, "src", "commands", `${name}.ts`), "utf-8");

	it("creates src/commands/<name>.ts typed with core's Command", async () => {
		await makeCommand("send-emails");
		const content = file("send-emails");
		expect(content).toContain('import type { Command } from "@bunary/core";');
		expect(content).toContain("export const sendEmailsCommand: Command = {");
		expect(content).toContain('name: "send-emails"');
		expect(content).toContain('usage: "bunary send-emails"');
		expect(content).toContain("async run(args, flags)");
	});

	it("uses --name for the CLI name", async () => {
		await makeCommand("send-emails", { commandName: "mail:send" });
		const content = file("send-emails");
		expect(content).toContain('name: "mail:send"');
		expect(content).toContain('usage: "bunary mail:send"');
	});

	it("rejects an invalid CLI name", async () => {
		for (const bad of ["Mail Send", 'x"; evil', "mail:", ":send", "1abc"]) {
			await expect(
				makeCommand("send-emails", { commandName: bad }),
			).rejects.toThrow(/Invalid command name/);
		}
		expect(existsSync(join(testDir, "src"))).toBe(false);
	});

	it("refuses to overwrite an existing file", async () => {
		await makeCommand("send-emails");
		await expect(makeCommand("send-emails")).rejects.toThrow("already exists");
	});

	it("requires a Bunary project", async () => {
		await writeFile(join(testDir, "package.json"), "{}");
		await expect(makeCommand("send-emails")).rejects.toThrow(
			"Not in a Bunary project",
		);
	});

	it("registry definition passes --name through", async () => {
		await command.run(["send-emails"], { name: "mail:send" });
		expect(file("send-emails")).toContain('name: "mail:send"');
	});
});
