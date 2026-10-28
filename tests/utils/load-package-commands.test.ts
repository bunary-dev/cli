/**
 * Package-contributed commands: a direct `@bunary/*` dependency declares
 * `"bunary": { "commands": "./dist/cli.js" }` in its package.json.
 */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadPackageCommands } from "../../src/utils/loadPackageCommands.js";
import { makeTempDir } from "../helpers/temp-dir.js";

const ORM_CLI = `
export const commands = [
	{
		name: "db:migrate",
		description: "Apply migrations",
		usage: "bunary db:migrate",
		category: "database",
		flags: [{ name: "config", alias: "c", description: "Config", values: ["a", "b"] }],
		run: async () => {},
	},
	{ name: "make:model", description: "Generate a model", run: async () => {} },
];
`;

async function writeJson(path: string, value: unknown): Promise<void> {
	await writeFile(path, JSON.stringify(value));
}

/** Install a fake package under `<dir>/node_modules/<name>`. */
async function installPackage(
	dir: string,
	name: string,
	pkg: Record<string, unknown>,
	files: Record<string, string> = {},
): Promise<string> {
	const pkgDir = join(dir, "node_modules", ...name.split("/"));
	await mkdir(pkgDir, { recursive: true });
	await writeJson(join(pkgDir, "package.json"), { name, ...pkg });
	for (const [file, content] of Object.entries(files)) {
		await mkdir(join(pkgDir, file, ".."), { recursive: true });
		await writeFile(join(pkgDir, file), content);
	}
	return pkgDir;
}

describe("loadPackageCommands", () => {
	let root: string;
	let errors: string[];
	let errorSpy: ReturnType<typeof spyOn>;

	beforeEach(async () => {
		root = await makeTempDir("bunary-cli-pkg-cmds-");
		errors = [];
		errorSpy = spyOn(console, "error").mockImplementation((...a: unknown[]) => {
			errors.push(a.join(" "));
		});
	});

	afterEach(() => {
		errorSpy.mockRestore();
	});

	async function project(deps: Record<string, string>, dev = {}) {
		await writeJson(join(root, "package.json"), {
			name: "app",
			dependencies: deps,
			devDependencies: dev,
		});
	}

	test("returns nothing without a package.json", async () => {
		expect(await loadPackageCommands(root)).toEqual([]);
	});

	test("returns nothing for invalid package.json", async () => {
		await writeFile(join(root, "package.json"), "{nope");
		expect(await loadPackageCommands(root)).toEqual([]);
	});

	test("loads and normalizes commands declared by a direct @bunary dependency", async () => {
		await project({ "@bunary/core": "^1", "@bunary/orm": "^1" });
		await installPackage(
			root,
			"@bunary/orm",
			{ bunary: { commands: "./dist/cli.js" } },
			{ "dist/cli.js": ORM_CLI },
		);

		const result = await loadPackageCommands(root);
		expect(result).toHaveLength(1);
		const [orm] = result;
		expect(orm?.packageName).toBe("@bunary/orm");
		expect(orm?.commands.map((c) => c.name)).toEqual([
			"db:migrate",
			"make:model",
		]);
		const migrate = orm?.commands[0];
		expect(migrate?.usage).toBe("bunary db:migrate");
		expect(migrate?.category).toBe("database");
		expect(migrate?.flags?.[0]?.name).toBe("--config");
		expect(migrate?.flags?.[0]?.alias).toBe("-c");
		expect(orm?.commands[1]?.category).toBe("@bunary/orm");
		expect(errors).toEqual([]);
	});

	test("accepts a default-exported array and devDependencies", async () => {
		await project({}, { "@bunary/orm": "^1" });
		await installPackage(
			root,
			"@bunary/orm",
			{ bunary: { commands: "cli.js" } },
			{
				"cli.js":
					"export default [{ name: 'db:studio', description: 'Studio', run: async () => {} }];",
			},
		);
		const [orm] = await loadPackageCommands(root);
		expect(orm?.commands.map((c) => c.name)).toEqual(["db:studio"]);
	});

	test("ignores dependencies outside the @bunary scope", async () => {
		await project({ "evil-pkg": "^1", "@other/orm": "^1" });
		for (const name of ["evil-pkg", "@other/orm"]) {
			await installPackage(
				root,
				name,
				{ bunary: { commands: "cli.js" } },
				{ "cli.js": "throw new Error('must not be imported');" },
			);
		}
		expect(await loadPackageCommands(root)).toEqual([]);
		expect(errors).toEqual([]);
	});

	test("ignores installed @bunary packages that are not direct dependencies", async () => {
		await project({ "@bunary/core": "^1" });
		await installPackage(
			root,
			"@bunary/orm",
			{ bunary: { commands: "cli.js" } },
			{ "cli.js": ORM_CLI },
		);
		expect(await loadPackageCommands(root)).toEqual([]);
	});

	test("ignores packages that declare no commands", async () => {
		await project({ "@bunary/core": "^1", "@bunary/http": "^1" });
		await installPackage(root, "@bunary/core", {});
		await installPackage(root, "@bunary/http", { bunary: {} });
		expect(await loadPackageCommands(root)).toEqual([]);
		expect(errors).toEqual([]);
	});

	test("ignores dependencies that are not installed", async () => {
		await project({ "@bunary/orm": "^1" });
		expect(await loadPackageCommands(root)).toEqual([]);
		expect(errors).toEqual([]);
	});

	test("finds packages hoisted to a parent node_modules", async () => {
		const app = join(root, "apps", "api");
		await mkdir(app, { recursive: true });
		await writeJson(join(app, "package.json"), {
			dependencies: { "@bunary/orm": "workspace:*" },
		});
		await installPackage(
			root,
			"@bunary/orm",
			{ bunary: { commands: "cli.js" } },
			{ "cli.js": ORM_CLI },
		);
		const [orm] = await loadPackageCommands(app);
		expect(orm?.commands).toHaveLength(2);
	});

	test("refuses a commands path outside the package", async () => {
		await project({ "@bunary/orm": "^1" });
		await writeFile(join(root, "outside.js"), "throw new Error('imported');");
		await installPackage(root, "@bunary/orm", {
			bunary: { commands: "../../../outside.js" },
		});
		expect(await loadPackageCommands(root)).toEqual([]);
		expect(errors.join("\n")).toMatch(/@bunary\/orm.*outside the package/);
	});

	test("warns and skips a package whose commands fail to load", async () => {
		await project({ "@bunary/orm": "^1", "@bunary/queue": "^1" });
		await installPackage(
			root,
			"@bunary/orm",
			{ bunary: { commands: "cli.js" } },
			{ "cli.js": "throw new Error('boom');" },
		);
		await installPackage(
			root,
			"@bunary/queue",
			{ bunary: { commands: "cli.js" } },
			{
				"cli.js":
					"export const commands = [{ name: 'queue:work', description: 'Work', run: async () => {} }];",
			},
		);
		const result = await loadPackageCommands(root);
		expect(result.map((r) => r.packageName)).toEqual(["@bunary/queue"]);
		expect(errors.join("\n")).toMatch(/@bunary\/orm.*boom/);
	});

	test("warns when the module exports no commands array", async () => {
		await project({ "@bunary/orm": "^1" });
		await installPackage(
			root,
			"@bunary/orm",
			{ bunary: { commands: "cli.js" } },
			{ "cli.js": "export const nothing = 1;" },
		);
		expect(await loadPackageCommands(root)).toEqual([]);
		expect(errors.join("\n")).toMatch(/@bunary\/orm.*commands/);
	});

	test("skips invalid entries with a warning", async () => {
		await project({ "@bunary/orm": "^1" });
		await installPackage(
			root,
			"@bunary/orm",
			{ bunary: { commands: "cli.js" } },
			{
				"cli.js":
					"export const commands = [{ name: 'ok', description: 'Ok', run: async () => {} }, { description: 'no name' }];",
			},
		);
		const [orm] = await loadPackageCommands(root);
		expect(orm?.commands.map((c) => c.name)).toEqual(["ok"]);
		expect(errors.join("\n")).toMatch(/commands\[1\].*"name"/);
	});
});
