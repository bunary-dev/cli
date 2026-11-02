import { describe, expect, test } from "bun:test";
import type { Command as CoreCommand } from "@bunary/core";
import type { Command } from "../../src/types/command.js";
import { normalizeCommand } from "../../src/utils/normalizeCommand.js";

describe("normalizeCommand", () => {
	test("accepts a @bunary/core Command and dashes its flag names", () => {
		const core: CoreCommand = {
			name: "deploy",
			description: "Deploy",
			usage: "bunary deploy",
			category: "ops",
			flags: [
				{ name: "env", alias: "e", description: "Env", values: ["a", "b"] },
				{ name: "--force", alias: "-f", description: "Force" },
			],
			run: async () => {},
		};
		const out: Command = normalizeCommand(core, "project");
		expect(out.flags?.map((f) => [f.name, f.alias])).toEqual([
			["--env", "-e"],
			["--force", "-f"],
		]);
		expect(out.usage).toBe("bunary deploy");
		expect(out.category).toBe("ops");
	});

	test("defaults an empty category", () => {
		const core = {
			name: "seed",
			description: "Seed",
			usage: "",
			category: "",
			run: async () => {},
		} satisfies CoreCommand;
		expect(normalizeCommand(core, "project").category).toBe("project");
	});

	test("a `<placeholder>` in a core flag name declares a value-taking flag", () => {
		// Core's CommandFlag has no `takesValue` (#137): the placeholder is the
		// typed way to declare a free-text flag in an app or package command.
		const core: CoreCommand = {
			name: "export",
			description: "Export",
			usage: "bunary export",
			category: "project",
			flags: [
				{ name: "out <dir>", alias: "o", description: "Output directory" },
				{ name: "--to <file>", description: "Target file" },
				{ name: "force", description: "Overwrite" },
			],
			run: async () => {},
		};
		const out = normalizeCommand(core, "project");
		expect(out.flags).toEqual([
			{
				name: "--out",
				alias: "-o",
				description: "Output directory",
				takesValue: true,
				placeholder: "dir",
			},
			{
				name: "--to",
				description: "Target file",
				takesValue: true,
				placeholder: "file",
			},
			{ name: "--force", description: "Overwrite" },
		]);
	});

	test("keeps `takesValue` set on flags at runtime", () => {
		const outFlag = { name: "out", description: "Out", takesValue: true };
		const core: CoreCommand = {
			name: "export",
			description: "Export",
			usage: "bunary export",
			category: "project",
			flags: [outFlag],
			run: async () => {},
		};
		expect(normalizeCommand(core, "project").flags?.[0]).toEqual({
			name: "--out",
			description: "Out",
			takesValue: true,
		});
	});
});
