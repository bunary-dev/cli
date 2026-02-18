import { describe, expect, test } from "bun:test";
import { commands, findCommand, getCommandNames } from "../src/registry.js";
import type { CommandCategory } from "../src/types/command.js";

describe("command registry", () => {
	test("exports an array of commands", () => {
		expect(Array.isArray(commands)).toBe(true);
		expect(commands.length).toBeGreaterThan(0);
	});

	test("contains all 8 built-in commands", () => {
		const names = commands.map((c) => c.name);
		expect(names).toContain("init");
		expect(names).toContain("route:make");
		expect(names).toContain("middleware:make");
		expect(names).toContain("model:make");
		expect(names).toContain("migration:make");
		expect(names).toContain("migrate");
		expect(names).toContain("migrate:rollback");
		expect(names).toContain("migrate:status");
		expect(names).toHaveLength(8);
	});

	test("every command has required properties", () => {
		for (const cmd of commands) {
			expect(typeof cmd.name).toBe("string");
			expect(cmd.name.length).toBeGreaterThan(0);
			expect(typeof cmd.description).toBe("string");
			expect(cmd.description.length).toBeGreaterThan(0);
			expect(typeof cmd.category).toBe("string");
			expect(typeof cmd.run).toBe("function");
		}
	});

	test("every command has a valid category", () => {
		const validCategories: CommandCategory[] = ["scaffold", "database"];
		for (const cmd of commands) {
			expect(validCategories).toContain(cmd.category);
		}
	});

	test("scaffold commands have correct category", () => {
		const scaffoldNames = [
			"init",
			"route:make",
			"middleware:make",
			"model:make",
		];
		for (const name of scaffoldNames) {
			const cmd = commands.find((c) => c.name === name);
			expect(cmd).toBeDefined();
			expect(cmd?.category).toBe("scaffold");
		}
	});

	test("database commands have correct category", () => {
		const dbNames = [
			"migration:make",
			"migrate",
			"migrate:rollback",
			"migrate:status",
		];
		for (const name of dbNames) {
			const cmd = commands.find((c) => c.name === name);
			expect(cmd).toBeDefined();
			expect(cmd?.category).toBe("database");
		}
	});

	test("commands with required args declare them", () => {
		const expectedArgs: Record<string, string[]> = {
			init: ["name"],
			"route:make": ["name"],
			"middleware:make": ["name"],
			"model:make": ["table"],
			"migration:make": ["name"],
		};

		for (const [cmdName, argNames] of Object.entries(expectedArgs)) {
			const cmd = commands.find((c) => c.name === cmdName);
			expect(cmd).toBeDefined();
			expect(cmd?.args).toBeDefined();
			expect(cmd?.args?.map((a) => a.name)).toEqual(argNames);
			for (const arg of cmd?.args ?? []) {
				expect(arg.required).toBe(true);
			}
		}
	});

	test("commands without args do not declare them", () => {
		const noArgs = ["migrate", "migrate:rollback", "migrate:status"];
		for (const name of noArgs) {
			const cmd = commands.find((c) => c.name === name);
			expect(cmd).toBeDefined();
			expect(cmd?.args).toBeUndefined();
		}
	});

	test("init command declares --auth flag", () => {
		const initCmd = commands.find((c) => c.name === "init");
		expect(initCmd).toBeDefined();
		expect(initCmd?.flags).toBeDefined();
		const authFlag = initCmd?.flags?.find((f) => f.name === "--auth");
		expect(authFlag).toBeDefined();
		expect(authFlag?.values).toEqual(["basic", "jwt"]);
	});

	test("no duplicate command names", () => {
		const names = commands.map((c) => c.name);
		const unique = new Set(names);
		expect(unique.size).toBe(names.length);
	});
});

describe("findCommand", () => {
	test("finds a command by exact name", () => {
		const cmd = findCommand("init");
		expect(cmd).toBeDefined();
		expect(cmd?.name).toBe("init");
	});

	test("returns undefined for unknown command", () => {
		const cmd = findCommand("nonexistent");
		expect(cmd).toBeUndefined();
	});

	test("is case-sensitive", () => {
		const cmd = findCommand("Init");
		expect(cmd).toBeUndefined();
	});
});

describe("getCommandNames", () => {
	test("returns all command names as strings", () => {
		const names = getCommandNames();
		expect(names).toContain("init");
		expect(names).toContain("migrate");
		expect(names).toHaveLength(8);
	});

	test("returns a new array each call", () => {
		const a = getCommandNames();
		const b = getCommandNames();
		expect(a).not.toBe(b);
		expect(a).toEqual(b);
	});
});
