/**
 * Tests for project command registration in the command registry.
 */
import { beforeEach, describe, expect, test } from "bun:test";
import {
	commands,
	findCommand,
	getCommandNames,
	registerProjectCommands,
	resetRegistry,
} from "../../src/registry.js";
import type { Command } from "../../src/types/command.js";

/** Factory for a minimal valid project command. */
function makeProjectCommand(overrides: Partial<Command> = {}): Command {
	return {
		name: "test:cmd",
		description: "A test project command",
		category: "project",
		run: async () => {},
		...overrides,
	};
}

describe("registerProjectCommands", () => {
	beforeEach(() => {
		resetRegistry();
	});

	test("merges project commands into the registry", () => {
		const before = commands.length;
		registerProjectCommands([makeProjectCommand({ name: "my:cmd" })]);
		expect(commands.length).toBe(before + 1);
	});

	test("project commands are findable by name", () => {
		registerProjectCommands([makeProjectCommand({ name: "deploy" })]);
		const cmd = findCommand("deploy");
		expect(cmd).toBeDefined();
		expect(cmd?.name).toBe("deploy");
	});

	test("project command names appear in getCommandNames", () => {
		registerProjectCommands([makeProjectCommand({ name: "db:seed" })]);
		const names = getCommandNames();
		expect(names).toContain("db:seed");
	});

	test("throws when project command name collides with built-in", () => {
		expect(() => {
			registerProjectCommands([makeProjectCommand({ name: "init" })]);
		}).toThrow(/cannot override built-in command/i);
	});

	test("throws when project command name collides with another project command", () => {
		expect(() => {
			registerProjectCommands([
				makeProjectCommand({ name: "dup" }),
				makeProjectCommand({ name: "dup" }),
			]);
		}).toThrow(/duplicate.*command/i);
	});

	test("built-in commands remain intact after registration", () => {
		registerProjectCommands([makeProjectCommand({ name: "custom" })]);

		const builtInNames = [
			"init",
			"route:make",
			"middleware:make",
			"model:make",
			"migration:make",
			"migrate",
			"migrate:rollback",
			"migrate:status",
		];
		for (const name of builtInNames) {
			expect(findCommand(name)).toBeDefined();
		}
	});

	test("registering empty array is a no-op", () => {
		const before = commands.length;
		registerProjectCommands([]);
		expect(commands.length).toBe(before);
	});
});

describe("resetRegistry", () => {
	test("removes project commands but keeps built-ins", () => {
		registerProjectCommands([makeProjectCommand({ name: "temp:cmd" })]);
		expect(findCommand("temp:cmd")).toBeDefined();

		resetRegistry();
		expect(findCommand("temp:cmd")).toBeUndefined();
		expect(findCommand("init")).toBeDefined();
	});
});
