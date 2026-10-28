/**
 * Every generator must keep its output inside the project root (#83):
 * traversal in names is rejected, and so is a target directory that is a
 * symlink leading out of the project.
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, readdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeCommand } from "../../src/commands/command/makeCommand.js";
import { makeMiddleware } from "../../src/commands/middleware/makeMiddleware.js";
import { makeProvider } from "../../src/commands/provider/makeProvider.js";
import { makeRoute } from "../../src/commands/route/makeRoute.js";
import { makeTempDir } from "../helpers/temp-dir.js";

const generators: [string, string, (n: string) => Promise<void>][] = [
	["make:route", "routes", makeRoute],
	["make:middleware", "middleware", makeMiddleware],
	["make:command", "commands", (n) => makeCommand(n)],
	["make:provider", "providers", makeProvider],
];

const TRAVERSALS = [
	"../escape",
	"../../escape",
	"..",
	".",
	"/tmp/escape",
	"a/../../escape",
	"..\\escape",
	"sub/escape",
	"%2e%2e/escape",
	"escape\0",
	".hidden",
	"",
];

describe("generated paths are confined to the project root", () => {
	let root: string;
	let outside: string;
	let originalCwd: string;
	const originalLog = console.log;

	beforeEach(async () => {
		originalCwd = process.cwd();
		outside = await makeTempDir("bunary-cli-outside-");
		root = await makeTempDir("bunary-cli-confine-");
		process.chdir(root);
		await writeFile(
			join(root, "package.json"),
			JSON.stringify({ name: "t", dependencies: { "@bunary/core": "^0" } }),
		);
		console.log = () => {};
	});

	afterEach(() => {
		console.log = originalLog;
		process.chdir(originalCwd);
	});

	for (const [name, dir, generate] of generators) {
		for (const bad of TRAVERSALS) {
			it(`${name} rejects ${JSON.stringify(bad)}`, async () => {
				await expect(generate(bad)).rejects.toThrow(/Invalid/);
				expect(existsSync(join(root, "src"))).toBe(false);
				expect(await readdir(outside)).toEqual([]);
			});
		}

		it(`${name} refuses a src/${dir} symlink leading outside`, async () => {
			await mkdir(join(root, "src"), { recursive: true });
			await symlink(outside, join(root, "src", dir));
			await expect(generate("escape")).rejects.toThrow(/outside the project/);
			expect(await readdir(outside)).toEqual([]);
		});

		it(`${name} refuses a src symlink leading outside`, async () => {
			await symlink(outside, join(root, "src"));
			await expect(generate("escape")).rejects.toThrow(/outside the project/);
			expect(await readdir(outside)).toEqual([]);
		});
	}
});
