import { describe, expect, test } from "bun:test";
import type { CommandFlag } from "../../src/types/command.js";
import { parseFlags, validateFlags } from "../../src/utils/parseFlags.js";

describe("parseFlags", () => {
	describe("positional arguments", () => {
		test("returns positional args when no flags present", () => {
			const [positional, flags] = parseFlags(["my-app"]);
			expect(positional).toEqual(["my-app"]);
			expect(flags).toEqual({});
		});

		test("returns empty arrays for no arguments", () => {
			const [positional, flags] = parseFlags([]);
			expect(positional).toEqual([]);
			expect(flags).toEqual({});
		});

		test("returns multiple positional args", () => {
			const [positional] = parseFlags(["a", "b", "c"]);
			expect(positional).toEqual(["a", "b", "c"]);
		});
	});

	describe("flags with values", () => {
		test("parses --key value pair", () => {
			const [positional, flags] = parseFlags(["--auth", "jwt"]);
			expect(positional).toEqual([]);
			expect(flags).toEqual({ auth: "jwt" });
		});

		test("parses flag after positional arg", () => {
			const [positional, flags] = parseFlags(["my-app", "--auth", "basic"]);
			expect(positional).toEqual(["my-app"]);
			expect(flags).toEqual({ auth: "basic" });
		});

		test("parses multiple flags", () => {
			const [positional, flags] = parseFlags([
				"my-app",
				"--auth",
				"jwt",
				"--port",
				"3000",
			]);
			expect(positional).toEqual(["my-app"]);
			expect(flags).toEqual({ auth: "jwt", port: "3000" });
		});

		test("parses flags interspersed with positional args", () => {
			const [positional, flags] = parseFlags([
				"--auth",
				"jwt",
				"my-app",
				"--port",
				"3000",
			]);
			expect(positional).toEqual(["my-app"]);
			expect(flags).toEqual({ auth: "jwt", port: "3000" });
		});
	});

	describe("boolean flags", () => {
		test("parses flag at end of args as boolean true", () => {
			const [positional, flags] = parseFlags(["my-app", "--dry-run"]);
			expect(positional).toEqual(["my-app"]);
			expect(flags).toEqual({ "dry-run": true });
		});

		test("parses consecutive flags as boolean", () => {
			const [positional, flags] = parseFlags(["--dry-run", "--verbose"]);
			expect(positional).toEqual([]);
			expect(flags).toEqual({ "dry-run": true, verbose: true });
		});

		test("parses boolean flag before value flag", () => {
			const [positional, flags] = parseFlags([
				"my-app",
				"--dry-run",
				"--auth",
				"jwt",
			]);
			expect(positional).toEqual(["my-app"]);
			expect(flags).toEqual({ "dry-run": true, auth: "jwt" });
		});

		test("parses standalone boolean flag", () => {
			const [positional, flags] = parseFlags(["--verbose"]);
			expect(positional).toEqual([]);
			expect(flags).toEqual({ verbose: true });
		});
	});

	describe("duplicate flags", () => {
		test("throws on duplicate value flags", () => {
			expect(() => {
				parseFlags(["--auth", "basic", "--auth", "jwt"]);
			}).toThrow("Duplicate flag: --auth");
		});

		test("throws on duplicate boolean flags", () => {
			expect(() => {
				parseFlags(["--dry-run", "--dry-run"]);
			}).toThrow("Duplicate flag: --dry-run");
		});

		test("throws on boolean then value duplicate", () => {
			expect(() => {
				parseFlags(["--auth", "--auth", "jwt"]);
			}).toThrow("Duplicate flag: --auth");
		});
	});

	describe("edge cases", () => {
		test("treats single dash arg as positional", () => {
			const [positional, flags] = parseFlags(["-"]);
			expect(positional).toEqual(["-"]);
			expect(flags).toEqual({});
		});

		test("treats single dash word as positional", () => {
			const [positional] = parseFlags(["-v"]);
			expect(positional).toEqual(["-v"]);
		});

		test("handles empty string arg", () => {
			const [positional] = parseFlags([""]);
			expect(positional).toEqual([""]);
		});

		test("handles flag with empty string value", () => {
			const [, flags] = parseFlags(["--name", ""]);
			expect(flags).toEqual({ name: "" });
		});
	});
});

describe("validateFlags", () => {
	const sampleFlags: CommandFlag[] = [
		{
			name: "--auth",
			description: "Auth scaffolding type",
			values: ["basic", "jwt"],
		},
		{
			name: "--port",
			description: "Server port",
		},
	];

	test("accepts valid flag with allowed value", () => {
		expect(() => {
			validateFlags({ auth: "jwt" }, sampleFlags);
		}).not.toThrow();
	});

	test("accepts valid flag without value constraints", () => {
		expect(() => {
			validateFlags({ port: "3000" }, sampleFlags);
		}).not.toThrow();
	});

	test("throws for unknown flag", () => {
		expect(() => {
			validateFlags({ unknown: "value" }, sampleFlags);
		}).toThrow("Unknown flag: --unknown");
	});

	test("throws for invalid flag value", () => {
		expect(() => {
			validateFlags({ auth: "oauth" }, sampleFlags);
		}).toThrow('Invalid value "oauth" for --auth');
	});

	test("error message includes allowed values", () => {
		expect(() => {
			validateFlags({ auth: "oauth" }, sampleFlags);
		}).toThrow("basic, jwt");
	});

	test("accepts boolean flag when no values defined", () => {
		const flagDefs: CommandFlag[] = [
			{ name: "--verbose", description: "Verbose output" },
		];
		expect(() => {
			validateFlags({ verbose: true }, flagDefs);
		}).not.toThrow();
	});

	test("passes with no flags and no definitions", () => {
		expect(() => {
			validateFlags({}, []);
		}).not.toThrow();
	});

	test("passes with no flags when definitions exist", () => {
		expect(() => {
			validateFlags({}, sampleFlags);
		}).not.toThrow();
	});

	test("passes with undefined flag definitions", () => {
		expect(() => {
			validateFlags({ anything: "value" }, undefined);
		}).not.toThrow();
	});
});
