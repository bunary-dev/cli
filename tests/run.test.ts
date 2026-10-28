/**
 * In-process tests for run(), so the dispatcher counts toward coverage.
 */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { run } from "../src/cli.js";
import { findCommand, resetRegistry } from "../src/registry.js";
import { makeTempDir } from "./helpers/temp-dir.js";

describe("run()", () => {
	let cwd: string;
	let originalCwd: string;
	let out: string;
	let err: string;
	let logSpy: ReturnType<typeof spyOn>;
	let errSpy: ReturnType<typeof spyOn>;

	beforeEach(async () => {
		originalCwd = process.cwd();
		cwd = await makeTempDir("bunary-cli-run-");
		process.chdir(cwd);
		await writeFile(
			join(cwd, "package.json"),
			JSON.stringify({ name: "app", dependencies: { "@bunary/core": "^1" } }),
		);
		out = "";
		err = "";
		logSpy = spyOn(console, "log").mockImplementation((...a: unknown[]) => {
			out += `${a.join(" ")}\n`;
		});
		errSpy = spyOn(console, "error").mockImplementation((...a: unknown[]) => {
			err += `${a.join(" ")}\n`;
		});
	});

	afterEach(() => {
		logSpy.mockRestore();
		errSpy.mockRestore();
		process.chdir(originalCwd);
		resetRegistry();
	});

	test("no args prints help", async () => {
		expect(await run([])).toBe(0);
		expect(out).toContain("make:provider");
	});

	test("--version", async () => {
		expect(await run(["-v"])).toBe(0);
		expect(out).toMatch(/@bunary\/cli v/);
	});

	test("per-command help stops before a bare --", async () => {
		expect(await run(["make:route", "--help"])).toBe(0);
		expect(out).toContain("bunary make:route");
		expect(await run(["make:route", "--", "--help"])).toBe(1);
		expect(err).toContain("Invalid route name");
	});

	test("runs a generator with leading global switches", async () => {
		expect(await run(["--dry-run", "make:provider", "cache"])).toBe(0);
		expect(out).toContain("src/providers/cache.ts");
		expect(existsSync(join(cwd, "src"))).toBe(false);
		expect(await run(["make:command", "send-emails", "--name=mail:send"])).toBe(
			0,
		);
		expect(existsSync(join(cwd, "src", "commands", "send-emails.ts"))).toBe(
			true,
		);
	});

	test("reports unknown flags and missing args", async () => {
		expect(await run(["make:route", "users", "--nope"])).toBe(1);
		expect(err).toContain("Unknown flag: --nope");
		expect(await run(["make:route"])).toBe(1);
		expect(err).toContain("Route name is required");
	});

	test("suggests close commands", async () => {
		expect(await run(["make:rout"])).toBe(1);
		expect(err).toContain("Did you mean: make:route?");
	});

	test("registers app commands from the config and resets between runs", async () => {
		await mkdir(join(cwd, "config"));
		await writeFile(
			join(cwd, "config", "bunary.ts"),
			`export default { app: { name: "app" }, commands: [
				{ name: "hello", description: "Say hello", run: async (args) => { console.log("hello", args[0]); } },
			] };`,
		);
		expect(await run(["hello", "world"])).toBe(0);
		expect(out).toContain("hello world");
		expect(await run(["hello", "again"])).toBe(0);
		expect(findCommand("hello")).toBeDefined();
	});

	test("an app command colliding with a built-in fails", async () => {
		await writeFile(
			join(cwd, "bunary.config.ts"),
			`export default { app: { name: "app" }, commands: [
				{ name: "init", description: "Mine", run: async () => {} },
			] };`,
		);
		expect(await run(["--help"])).toBe(1);
		expect(err).toMatch(/built-in command "init".*bunary\.config\.ts/);
	});

	test("mentions a broken config when a command is unknown", async () => {
		await writeFile(join(cwd, "bunary.config.ts"), "throw new Error('bad');");
		expect(await run(["deploy"])).toBe(1);
		expect(err).toContain("project commands are unavailable: bad");
	});
});
