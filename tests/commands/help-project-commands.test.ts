/**
 * Tests for project commands appearing in CLI help output.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { showHelp } from "../../src/help.js";
import { registerProjectCommands, resetRegistry } from "../../src/registry.js";
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

		// Built-in sections still present
		expect(output).toContain("Scaffold");
		expect(output).toContain("Database");
		// Project section present
		expect(output).toContain("Project");
	});
});
