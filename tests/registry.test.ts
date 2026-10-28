import { beforeEach, describe, expect, test } from "bun:test";
import {
	commands,
	findCommand,
	getCommandNames,
	registerCommands,
	resetRegistry,
} from "../src/registry.js";
import type { Command } from "../src/types/command.js";

const BUILTINS = [
	"init",
	"make:route",
	"make:middleware",
	"make:command",
	"make:provider",
];

function cmd(name: string, overrides: Partial<Command> = {}): Command {
	return {
		name,
		description: `${name} command`,
		category: "project",
		run: async () => {},
		...overrides,
	};
}

describe("command registry", () => {
	beforeEach(() => {
		resetRegistry();
	});

	test("contains exactly the built-in scaffolding commands", () => {
		expect(commands.map((c) => c.name)).toEqual(BUILTINS);
	});

	test("ships no migration or model commands", () => {
		for (const name of [
			"migrate",
			"migrate:rollback",
			"migrate:status",
			"migration:make",
			"make:migration",
			"model:make",
			"make:model",
			"db:migrate",
		]) {
			expect(findCommand(name)).toBeUndefined();
		}
	});

	test("every command has required properties", () => {
		for (const c of commands) {
			expect(c.name.length).toBeGreaterThan(0);
			expect(c.description.length).toBeGreaterThan(0);
			expect(c.category).toBe("scaffold");
			expect(typeof c.run).toBe("function");
		}
	});

	test("commands with required args declare them", () => {
		for (const name of BUILTINS) {
			const c = findCommand(name);
			expect(c?.args?.map((a) => a.name)).toEqual(["name"]);
			// init prompts for a missing name in a terminal
			expect(c?.args?.[0]?.required).toBe(name !== "init");
		}
	});

	test("init command declares --interactive (-i) and --no-interactive", () => {
		const flags = findCommand("init")?.flags ?? [];
		expect(flags.find((f) => f.name === "--interactive")?.alias).toBe("-i");
		expect(flags.map((f) => f.name)).toContain("--no-interactive");
	});

	test("init command declares --auth, --force and --dry-run", () => {
		const flags = findCommand("init")?.flags?.map((f) => f.name);
		expect(flags).toContain("--auth");
		expect(flags).toContain("--force");
		expect(flags).toContain("--dry-run");
		const auth = findCommand("init")?.flags?.find((f) => f.name === "--auth");
		expect(auth?.values).toEqual(["basic", "jwt"]);
	});

	test("every make:* command supports --dry-run", () => {
		for (const name of BUILTINS.filter((n) => n.startsWith("make:"))) {
			const flags = findCommand(name)?.flags?.map((f) => f.name);
			expect(flags).toContain("--dry-run");
		}
	});
});

describe("registerCommands", () => {
	beforeEach(() => {
		resetRegistry();
	});

	test("adds commands from a source", () => {
		registerCommands([cmd("db:migrate")], "@bunary/orm");
		expect(findCommand("db:migrate")).toBeDefined();
		expect(getCommandNames()).toContain("db:migrate");
	});

	test("rejects a built-in name and names the source", () => {
		expect(() => registerCommands([cmd("make:route")], "@bunary/orm")).toThrow(
			/cannot override built-in command "make:route".*@bunary\/orm/i,
		);
		expect(findCommand("make:route")?.category).toBe("scaffold");
	});

	test("rejects a name already registered by another source", () => {
		registerCommands([cmd("db:migrate")], "@bunary/orm");
		expect(() =>
			registerCommands([cmd("db:migrate")], "config/bunary.ts"),
		).toThrow(/"db:migrate".*config\/bunary\.ts.*@bunary\/orm/);
	});

	test("rejects duplicates within one source", () => {
		expect(() =>
			registerCommands([cmd("dup"), cmd("dup")], "@bunary/orm"),
		).toThrow(/duplicate command name "dup"/i);
	});

	test("registers nothing from a batch that has a collision", () => {
		expect(() =>
			registerCommands([cmd("ok:one"), cmd("init")], "@bunary/orm"),
		).toThrow();
		expect(findCommand("ok:one")).toBeUndefined();
	});
});

describe("findCommand", () => {
	test("finds a command by exact name", () => {
		expect(findCommand("init")?.name).toBe("init");
	});

	test("returns undefined for unknown command", () => {
		expect(findCommand("nonexistent")).toBeUndefined();
	});

	test("is case-sensitive", () => {
		expect(findCommand("Init")).toBeUndefined();
	});
});

describe("getCommandNames", () => {
	test("returns a new array each call", () => {
		const a = getCommandNames();
		const b = getCommandNames();
		expect(a).not.toBe(b);
		expect(a).toEqual(b);
	});
});
