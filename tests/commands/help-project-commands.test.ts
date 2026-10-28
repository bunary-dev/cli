/**
 * Tests for project commands appearing in CLI help output.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { showCommandHelp, showHelp } from "../../src/help.js";
import {
	registerCommands,
	registerProjectCommands,
	resetRegistry,
} from "../../src/registry.js";
import type { Command } from "../../src/types/command.js";

describe("help with project commands", () => {
	let output: string;
	const origLog = console.log;

	beforeEach(() => {
		resetRegistry();
		output = "";
		console.log = (msg: string) => {
			output += msg;
		};
	});

	afterEach(() => {
		console.log = origLog;
		resetRegistry();
	});

	test("project commands appear under Project section", () => {
		const cmd: Command = {
			name: "db:seed",
			description: "Seed the database",
			category: "project",
			run: async () => {},
		};
		registerProjectCommands([cmd]);
		showHelp();

		expect(output).toContain("Project");
		expect(output).toContain("db:seed");
		expect(output).toContain("Seed the database");
	});

	test("Project section does not appear when no project commands", () => {
		showHelp();
		expect(output).not.toContain("Project");
	});

	test("project commands are separated from built-in commands", () => {
		const cmd: Command = {
			name: "deploy",
			description: "Deploy the app",
			category: "project",
			run: async () => {},
		};
		registerProjectCommands([cmd]);
		showHelp();

		// Built-in section still present
		expect(output).toContain("Scaffold");
		// Project section present
		expect(output).toContain("Project");
	});

	test("no Database section without package-contributed commands", () => {
		showHelp();
		expect(output).not.toContain("Database");
		expect(output).not.toContain("migrate");
	});

	test("package commands with custom categories get their own section", () => {
		registerCommands(
			[
				{
					name: "db:migrate",
					description: "Apply migrations",
					category: "database",
					run: async () => {},
				},
				{
					name: "queue:work",
					description: "Process jobs",
					category: "queue",
					run: async () => {},
				},
			],
			"@bunary/orm",
		);
		showHelp();
		expect(output).toContain("Database");
		expect(output).toContain("db:migrate");
		expect(output).toContain("Queue");
		expect(output.indexOf("Scaffold")).toBeLessThan(output.indexOf("Database"));
	});

	test("per-command help prints the declared usage and flag aliases", () => {
		registerCommands(
			[
				{
					name: "db:studio",
					description: "Open Drizzle Studio",
					usage: "bunary db:studio [--port <n>]",
					category: "database",
					flags: [
						{
							name: "--port",
							alias: "-p",
							description: "Port",
							takesValue: true,
						},
					],
					run: async () => {},
				},
			],
			"@bunary/orm",
		);
		showCommandHelp("db:studio");
		expect(output).toContain("bunary db:studio [--port <n>]");
		expect(output).toContain("-p, --port");
	});
});
