import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeTempDirSync } from "./helpers/temp-dir.js";

const root = join(import.meta.dir, "..");
const bin = join(root, "src", "bin.ts");

async function spawn(cmd: string[], cwd: string) {
	const proc = Bun.spawn(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
	const [stdout, stderr, code] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { stdout, stderr, code, cwd };
}

async function cli(...args: string[]) {
	return spawn(["bun", bin, ...args], makeTempDirSync("bunary-cli-"));
}

async function cliIn(cwd: string, ...args: string[]) {
	return spawn(["bun", bin, ...args], cwd);
}

/** A Bunary project with a fake `@bunary/orm` contributing commands. */
async function projectWithOrm(cli = ""): Promise<string> {
	const cwd = makeTempDirSync("bunary-cli-");
	await writeFile(
		join(cwd, "package.json"),
		JSON.stringify({
			name: "app",
			dependencies: { "@bunary/core": "^1", "@bunary/orm": "^1" },
		}),
	);
	const orm = join(cwd, "node_modules", "@bunary", "orm");
	await mkdir(join(orm, "dist"), { recursive: true });
	await writeFile(
		join(orm, "package.json"),
		JSON.stringify({
			name: "@bunary/orm",
			bunary: { commands: "./dist/cli.js" },
		}),
	);
	await writeFile(
		join(orm, "dist", "cli.js"),
		cli ||
			`export const commands = [
				{
					name: "db:migrate",
					description: "Apply migrations with drizzle-kit",
					usage: "bunary db:migrate",
					category: "database",
					flags: [{ name: "config", alias: "c", description: "Config file", values: ["a.ts", "b.ts"] }],
					run: async (args, flags) => { console.log("migrate", JSON.stringify(flags)); },
				},
				{
					name: "make:model",
					description: "Generate a model",
					usage: "bunary make:model <name>",
					category: "scaffold",
					args: [{ name: "name", required: true, description: "Model name" }],
					run: async (args) => { console.log("model", args[0]); },
				},
			];`,
	);
	return cwd;
}

describe("cli end-to-end", () => {
	test("--version prints version", async () => {
		const r = await cli("--version");
		expect(r.code).toBe(0);
		expect(r.stdout).toMatch(/@bunary\/cli v\d+\.\d+\.\d+/);
	});

	test("init --help shows command help", async () => {
		const r = await cli("init", "--help");
		expect(r.code).toBe(0);
		expect(r.stdout).toContain("--auth");
		expect(r.stderr).not.toContain("Unknown flag");
	});

	test("make:route --help shows command help", async () => {
		const r = await cli("make:route", "-h");
		expect(r.code).toBe(0);
		expect(r.stdout).toContain("bunary make:route");
		expect(r.stdout).toContain("--dry-run");
	});

	test("init --auth with no value fails", async () => {
		const r = await cli("init", "app", "--auth");
		expect(r.code).toBe(1);
		expect(r.stderr).toContain("--auth requires a value");
	});

	test("init --auth=jwt is accepted", async () => {
		const r = await cli("init", "app", "--auth=jwt");
		expect(r.code).toBe(0);
		expect(await Bun.file(join(r.cwd, "app", "package.json")).exists()).toBe(
			true,
		);
	});

	test("init refuses to overwrite without --force", async () => {
		const r = await cli("init", "app");
		const again = await cliIn(r.cwd, "init", "app");
		expect(again.code).toBe(1);
		expect(again.stderr).toContain("Refusing to overwrite");
		const forced = await cliIn(r.cwd, "init", "app", "--force");
		expect(forced.code).toBe(0);
	});

	test("init with no args and piped stdin fails without prompting", async () => {
		const r = await cli("init");
		expect(r.code).toBe(1);
		expect(r.stderr).toContain("Project name is required");
		expect(r.stderr).toContain("Usage: bunary init");
		expect(readdirSync(r.cwd)).toEqual([]);
	});

	test("init --no-interactive with no name fails", async () => {
		const r = await cli("init", "--no-interactive");
		expect(r.code).toBe(1);
		expect(r.stderr).toContain("Project name is required");
	});

	test("init --interactive without a TTY falls back to the flags", async () => {
		const r = await cli("init", "app", "-i", "--auth", "jwt");
		expect(r.code).toBe(0);
		expect(
			await Bun.file(
				join(r.cwd, "app", "src", "middleware", "jwt.ts"),
			).exists(),
		).toBe(true);
	});

	test("init rejects --interactive with --no-interactive", async () => {
		const r = await cli("init", "app", "--interactive", "--no-interactive");
		expect(r.code).toBe(1);
		expect(r.stderr).toContain("cannot be combined");
	});

	test("init --dry-run writes nothing", async () => {
		const r = await cli("init", "app", "--dry-run");
		expect(r.code).toBe(0);
		expect(r.stdout).toContain("Dry run");
		expect(readdirSync(r.cwd)).toEqual([]);
	});

	test("help lists only built-ins outside a project", async () => {
		const r = await cli("--help");
		expect(r.code).toBe(0);
		for (const name of [
			"make:route",
			"make:middleware",
			"make:command",
			"make:provider",
		]) {
			expect(r.stdout).toContain(name);
		}
		expect(r.stdout).not.toContain("migrate");
		expect(r.stdout).not.toContain("make:model");
		expect(r.stdout).not.toContain("db:");
	});

	test("removed commands point at their replacement", async () => {
		const cases: [string, RegExp][] = [
			["route:make", /make:route/],
			["middleware:make", /make:middleware/],
			["model:make", /@bunary\/orm/],
			["migrate", /drizzle-kit/],
			["migration:make", /drizzle-kit/],
		];
		for (const [name, hint] of cases) {
			const r = await cli(name, "x");
			expect(r.code).toBe(1);
			expect(r.stderr).toContain(`Unknown command: ${name}`);
			expect(r.stderr).toMatch(hint);
		}
	});

	test("unknown make:model without @bunary/orm does not suggest it", async () => {
		const r = await cli("make:modl");
		expect(r.code).toBe(1);
		expect(r.stderr).not.toContain("make:model");
	});
});

describe("package-contributed commands", () => {
	test("appear in --help when the package is installed", async () => {
		const cwd = await projectWithOrm();
		const r = await cliIn(cwd, "--help");
		expect(r.code).toBe(0);
		expect(r.stdout).toContain("db:migrate");
		expect(r.stdout).toContain("make:model");
		expect(r.stdout).toContain("Database");
	});

	test("run with parsed flags and aliases", async () => {
		const cwd = await projectWithOrm();
		const r = await cliIn(cwd, "db:migrate", "-c", "b.ts");
		expect(r.stderr).toBe("");
		expect(r.code).toBe(0);
		expect(r.stdout).toContain('migrate {"config":"b.ts"}');

		const bad = await cliIn(cwd, "db:migrate", "--config=zzz");
		expect(bad.code).toBe(1);
		expect(bad.stderr).toContain("Allowed: a.ts, b.ts");
	});

	test("enforce required args", async () => {
		const cwd = await projectWithOrm();
		const r = await cliIn(cwd, "make:model");
		expect(r.code).toBe(1);
		expect(r.stderr).toContain("Model name is required");
		const ok = await cliIn(cwd, "make:model", "User");
		expect(ok.stdout).toContain("model User");
	});

	test("are suggested for typos", async () => {
		const cwd = await projectWithOrm();
		const r = await cliIn(cwd, "db:migrat");
		expect(r.stderr).toContain("Did you mean: db:migrate?");
	});

	test("a package that collides with a built-in is rejected, built-ins keep working", async () => {
		const cwd = await projectWithOrm(
			`export const commands = [
				{ name: "db:migrate", description: "Migrate", run: async () => {} },
				{ name: "make:route", description: "Hijack", run: async () => { console.log("HIJACKED"); } },
			];`,
		);
		const r = await cliIn(cwd, "make:route", "users", "--dry-run");
		expect(r.code).toBe(0);
		expect(r.stdout).not.toContain("HIJACKED");
		expect(r.stdout).toContain("src/routes/users.ts");
		expect(r.stderr).toMatch(/make:route.*@bunary\/orm/);
		const help = await cliIn(cwd, "--help");
		expect(help.stdout).not.toContain("db:migrate");
	});

	test("a project command cannot take a package command's name", async () => {
		const cwd = await projectWithOrm();
		await writeFile(
			join(cwd, "bunary.config.ts"),
			`export default { app: { name: "app" }, commands: [
				{ name: "db:migrate", description: "Mine", run: async () => {} },
			] };`,
		);
		const r = await cliIn(cwd, "--help");
		expect(r.code).toBe(1);
		expect(r.stderr).toMatch(/db:migrate.*bunary\.config\.ts.*@bunary\/orm/);
	});
});

describe("library entry", () => {
	test("importing the package has no side effects", async () => {
		const cwd = makeTempDirSync("bunary-cli-");
		const script = join(cwd, "import.ts");
		await writeFile(
			script,
			`const mod = await import(${JSON.stringify(join(root, "src", "index.ts"))});
			console.log(Object.keys(mod).sort().join(","));`,
		);
		const r = await spawn(["bun", script, "init", "should-not-exist"], cwd);
		expect(r.code).toBe(0);
		expect(r.stderr).toBe("");
		expect(r.stdout.trim()).toBe("run");
		expect(existsSync(join(cwd, "should-not-exist"))).toBe(false);
	});

	test("run() returns an exit code instead of exiting", async () => {
		const { run } = await import("../src/index.js");
		const errors: string[] = [];
		const orig = console.error;
		console.error = (...a: unknown[]) => {
			errors.push(a.join(" "));
		};
		try {
			expect(await run(["definitely-not-a-command"])).toBe(1);
		} finally {
			console.error = orig;
		}
		expect(errors.join("\n")).toContain("Unknown command");
	});
});
