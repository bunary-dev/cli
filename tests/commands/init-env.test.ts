/**
 * `init --auth` env scaffolding: .env.example, .gitignore and next steps (#151)
 */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateMiddlewareContent, init } from "../../src/commands/init.js";
import { makeTempDir } from "../helpers/temp-dir.js";

let TEST_DIR: string;
let originalCwd: string;

beforeEach(async () => {
	originalCwd = process.cwd();
	TEST_DIR = await makeTempDir("bunary-cli-init-env-");
	process.chdir(TEST_DIR);
});

afterEach(() => {
	process.chdir(originalCwd);
});

/** `KEY=value` assignments of a dotenv file, comments and blanks skipped. */
function parseEnv(text: string): Array<[string, string]> {
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line !== "" && !line.startsWith("#"))
		.map((line) => {
			const eq = line.indexOf("=");
			return [line.slice(0, eq), line.slice(eq + 1)];
		});
}

/** Run init and return everything it printed (colors off). */
async function initOutput(...args: Parameters<typeof init>): Promise<string> {
	const lines: string[] = [];
	const log = spyOn(console, "log").mockImplementation((...parts) => {
		lines.push(parts.join(" "));
	});
	const noColor = process.env.NO_COLOR;
	process.env.NO_COLOR = "1";
	try {
		await init(...args);
	} finally {
		log.mockRestore();
		if (noColor === undefined) delete process.env.NO_COLOR;
		else process.env.NO_COLOR = noColor;
	}
	return lines.join("\n");
}

/** Whether git ignores `path` in `dir` under its .gitignore. */
function gitIgnores(dir: string, path: string): boolean {
	Bun.spawnSync(["git", "init", "-q"], { cwd: dir });
	const res = Bun.spawnSync(["git", "check-ignore", "-q", path], { cwd: dir });
	return res.exitCode === 0;
}

describe("init --auth writes .env.example (#151)", () => {
	test("--auth basic: BASIC_AUTH_USER and BASIC_AUTH_PASSWORD, empty", async () => {
		await init("app", { auth: "basic" });
		const env = await readFile(join(TEST_DIR, "app", ".env.example"), "utf8");
		expect(parseEnv(env)).toEqual([
			["BASIC_AUTH_USER", ""],
			["BASIC_AUTH_PASSWORD", ""],
		]);
	});

	test("--auth jwt: JWT_SECRET, empty, with minimum length and generation hint", async () => {
		await init("app", { auth: "jwt" });
		const env = await readFile(join(TEST_DIR, "app", ".env.example"), "utf8");
		expect(parseEnv(env)).toEqual([["JWT_SECRET", ""]]);
		expect(env).toMatch(/#.*at least 32 characters/);
		expect(env).toMatch(/#.*openssl rand -base64 32/);
	});

	test("without --auth no .env.example is written", async () => {
		await init("app");
		expect(existsSync(join(TEST_DIR, "app", ".env.example"))).toBe(false);
	});

	test("init --auth refuses to overwrite an existing .env.example", async () => {
		await writeFile(join(TEST_DIR, ".env.example"), "ORIGINAL");
		await expect(init(".", { auth: "jwt" })).rejects.toThrow(/\.env\.example/);
		expect(await readFile(join(TEST_DIR, ".env.example"), "utf8")).toBe(
			"ORIGINAL",
		);
	});

	test("--dry-run lists .env.example and .gitignore without writing them", async () => {
		const out = await initOutput("app", { auth: "basic", dryRun: true });
		expect(out).toContain(".env.example");
		expect(out).toContain(".gitignore");
		expect(existsSync(join(TEST_DIR, "app"))).toBe(false);
	});
});

describe("init writes a .gitignore covering .env (#151)", () => {
	for (const auth of [undefined, "basic", "jwt"] as const) {
		test(`${auth ? `--auth ${auth}` : "no auth"}: .env ignored, .env.example not`, async () => {
			await init("app", { auth });
			const dir = join(TEST_DIR, "app");
			expect(await readFile(join(dir, ".gitignore"), "utf8")).toMatch(
				/^\.env$/m,
			);
			expect(gitIgnores(dir, ".env")).toBe(true);
			expect(gitIgnores(dir, ".env.example")).toBe(false);
			expect(gitIgnores(dir, "node_modules/x")).toBe(true);
		});
	}

	test("extends an existing .gitignore instead of refusing or replacing it", async () => {
		await writeFile(join(TEST_DIR, ".gitignore"), "coverage/\n.env");
		await init(".", { auth: "basic" });
		const text = await readFile(join(TEST_DIR, ".gitignore"), "utf8");
		expect(text.startsWith("coverage/\n.env\n")).toBe(true);
		expect(text.match(/^\.env$/gm)).toHaveLength(1);
		expect(text).toMatch(/^node_modules\/$/m);
		expect(gitIgnores(TEST_DIR, ".env.example")).toBe(false);
	});

	test("leaves an existing .gitignore that already covers everything as is", async () => {
		await init("app");
		const path = join(TEST_DIR, "app", ".gitignore");
		const first = await readFile(path, "utf8");
		await init("app", { force: true });
		expect(await readFile(path, "utf8")).toBe(first);
	});
});

describe("init next steps (#151)", () => {
	test("--auth basic: copy .env.example and fill in the credentials before bun run dev", async () => {
		const out = await initOutput("app", { auth: "basic" });
		const cp = out.indexOf("$ cp .env.example .env");
		const fill = out.indexOf(
			"fill in BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in .env",
		);
		const dev = out.indexOf("$ bun run dev");
		expect(cp).toBeGreaterThan(out.indexOf("$ bun install"));
		expect(fill).toBeGreaterThan(cp);
		expect(dev).toBeGreaterThan(fill);
	});

	test("--auth jwt: copy .env.example and fill in JWT_SECRET before bun run dev", async () => {
		const out = await initOutput("app", { auth: "jwt" });
		const cp = out.indexOf("$ cp .env.example .env");
		const fill = out.indexOf("fill in JWT_SECRET in .env");
		expect(cp).toBeGreaterThan(-1);
		expect(fill).toBeGreaterThan(cp);
		expect(out.indexOf("$ bun run dev")).toBeGreaterThan(fill);
	});

	test("without --auth: no env step", async () => {
		const out = await initOutput("app");
		expect(out).not.toContain(".env");
		expect(out).toContain("$ bun run dev");
	});
});

describe("auth middleware fails fast pointing at .env.example (#151)", () => {
	test("basic", async () => {
		const content = await generateMiddlewareContent("basic");
		expect(content).toContain(
			"BASIC_AUTH_USER and BASIC_AUTH_PASSWORD are required",
		);
		expect(content).toMatch(/throw new Error\([^)]*\.env\.example/s);
	});

	test("jwt: missing or shorter than 32 characters", async () => {
		const content = await generateMiddlewareContent("jwt");
		expect(content).toContain("JWT_SECRET is required");
		expect(content).toContain("secret.length < 32");
		expect(content).toMatch(/throw new Error\([^)]*\.env\.example/s);
	});

	test("no stub carries a default secret", async () => {
		for (const auth of ["basic", "jwt"] as const) {
			const content = await generateMiddlewareContent(auth);
			expect(content).not.toMatch(/process\.env\.\w+\s*(\?\?|\|\|)/);
		}
	});
});
