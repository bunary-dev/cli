/**
 * `make:middleware basic|jwt` env scaffolding: .env.example, .gitignore and
 * next steps, the same as `init --auth` writes (#153)
 */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeMiddleware } from "../../src/commands/middleware/makeMiddleware.js";
import { generateEnvExample } from "../../src/commands/project/env.js";
import { makeTempDir } from "../helpers/temp-dir.js";

let dir: string;
let originalCwd: string;

beforeEach(async () => {
	originalCwd = process.cwd();
	dir = await makeTempDir("bunary-cli-make-middleware-env-");
	process.chdir(dir);
	await writeFile(
		join(dir, "package.json"),
		JSON.stringify({ name: "p", dependencies: { "@bunary/core": "^0.4.0" } }),
	);
});

afterEach(() => {
	process.chdir(originalCwd);
});

/** Run make:middleware and return everything it printed (colors off). */
async function output(
	...args: Parameters<typeof makeMiddleware>
): Promise<string> {
	const lines: string[] = [];
	const log = spyOn(console, "log").mockImplementation((...parts) => {
		lines.push(parts.join(" "));
	});
	const noColor = process.env.NO_COLOR;
	process.env.NO_COLOR = "1";
	try {
		await makeMiddleware(...args);
	} finally {
		log.mockRestore();
		if (noColor === undefined) delete process.env.NO_COLOR;
		else process.env.NO_COLOR = noColor;
	}
	return lines.join("\n");
}

const read = (file: string) => readFile(join(dir, file), "utf8");

/** Keys assigned in a dotenv file, in order (duplicates kept). */
function keys(text: string): string[] {
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line !== "" && !line.startsWith("#"))
		.map((line) => line.slice(0, line.indexOf("=")));
}

describe("make:middleware basic|jwt .env.example (#153)", () => {
	test("no .env.example: created with init --auth's content", async () => {
		await output("basic");
		expect(await read(".env.example")).toBe(
			(await generateEnvExample("basic")) as string,
		);
		expect(keys(await read(".env.example"))).toEqual([
			"BASIC_AUTH_USER",
			"BASIC_AUTH_PASSWORD",
		]);
	});

	test("jwt: created with JWT_SECRET and its hints", async () => {
		await output("jwt");
		const text = await read(".env.example");
		expect(text).toBe((await generateEnvExample("jwt")) as string);
		expect(keys(text)).toEqual(["JWT_SECRET"]);
		expect(text).toContain("openssl rand -base64 32");
	});

	test("existing .env.example: missing keys appended once, lines untouched", async () => {
		const existing = "# App\nAPP_NAME=demo\nPORT=3000";
		await writeFile(join(dir, ".env.example"), existing);
		await output("jwt");
		const text = await read(".env.example");
		expect(text.startsWith(`${existing}\n`)).toBe(true);
		expect(keys(text)).toEqual(["APP_NAME", "PORT", "JWT_SECRET"]);
		expect(text).toContain("# HS256 signing secret");
	});

	test("only the keys it lacks are appended", async () => {
		const existing = "BASIC_AUTH_USER=admin\n";
		await writeFile(join(dir, ".env.example"), existing);
		await output("basic");
		const text = await read(".env.example");
		expect(text.startsWith(existing)).toBe(true);
		expect(keys(text)).toEqual(["BASIC_AUTH_USER", "BASIC_AUTH_PASSWORD"]);
	});

	test("all keys present: .env.example left byte for byte", async () => {
		const existing = "# mine\nJWT_SECRET=\n";
		await writeFile(join(dir, ".env.example"), existing);
		await output("jwt");
		expect(await read(".env.example")).toBe(existing);
	});

	test("running twice adds no duplicates", async () => {
		await output("jwt");
		const first = await read(".env.example");
		const gitignore = await read(".gitignore");
		await Bun.file(join(dir, "src", "middleware", "jwt.ts")).delete();
		await output("jwt");
		expect(await read(".env.example")).toBe(first);
		expect(await read(".gitignore")).toBe(gitignore);
		expect(
			(await read(".gitignore")).split("\n").filter((l) => l === ".env"),
		).toHaveLength(1);
	});

	test("basic then jwt: both key sets present", async () => {
		await output("basic");
		await output("jwt");
		expect(keys(await read(".env.example"))).toEqual([
			"BASIC_AUTH_USER",
			"BASIC_AUTH_PASSWORD",
			"JWT_SECRET",
		]);
	});

	test("a real .env is never touched", async () => {
		await writeFile(join(dir, ".env"), "SECRET=1\n");
		await output("basic");
		expect(await read(".env")).toBe("SECRET=1\n");
	});
});

describe("make:middleware basic|jwt .gitignore (#153)", () => {
	test("no .gitignore: created, ignoring .env", async () => {
		await output("jwt");
		const lines = (await read(".gitignore")).split("\n");
		expect(lines.filter((l) => l === ".env")).toHaveLength(1);
		expect(lines).toContain("!.env.example");
	});

	test("existing .gitignore: kept, .env added once", async () => {
		await writeFile(join(dir, ".gitignore"), "coverage/");
		await output("basic");
		const text = await read(".gitignore");
		expect(text.startsWith("coverage/\n")).toBe(true);
		expect(text.split("\n").filter((l) => l === ".env")).toHaveLength(1);
	});

	test(".gitignore already ignoring .env: not duplicated", async () => {
		await writeFile(join(dir, ".gitignore"), "node_modules/\n.env\n");
		await output("jwt");
		const text = await read(".gitignore");
		expect(text.split("\n").filter((l) => l === ".env")).toHaveLength(1);
	});
});

describe("make:middleware next steps and other modes (#153)", () => {
	test("basic next steps: cp .env.example .env and fill in", async () => {
		const out = await output("basic");
		expect(out).toContain("cp .env.example .env");
		expect(out).toContain(
			"fill in BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in .env",
		);
		expect(out).toContain("in src/index.ts");
	});

	test("jwt next steps: cp .env.example .env and fill in", async () => {
		const out = await output("jwt");
		expect(out).toContain("cp .env.example .env");
		expect(out).toContain("fill in JWT_SECRET in .env");
	});

	test("plain make:middleware logger touches neither file", async () => {
		const out = await output("logger");
		expect(existsSync(join(dir, ".env.example"))).toBe(false);
		expect(existsSync(join(dir, ".gitignore"))).toBe(false);
		expect(out).not.toContain(".env");
	});

	test("--dry-run writes nothing but lists the env files", async () => {
		await writeFile(join(dir, ".gitignore"), "coverage/\n");
		const out = await output("jwt", { dryRun: true, verbose: true });
		expect(existsSync(join(dir, "src", "middleware", "jwt.ts"))).toBe(false);
		expect(existsSync(join(dir, ".env.example"))).toBe(false);
		expect(await read(".gitignore")).toBe("coverage/\n");
		expect(out).toContain("src/middleware/jwt.ts");
		expect(out).toContain(".env.example");
		expect(out).toContain(".gitignore");
		expect(out).toContain("JWT_SECRET=");
	});

	test("--dry-run with nothing to add does not list the env files", async () => {
		await writeFile(join(dir, ".env.example"), "JWT_SECRET=\n");
		await writeFile(
			join(dir, ".gitignore"),
			"node_modules/\ndist/\n.env\n.env.local\n.env.*.local\n!.env.example\n",
		);
		const out = await output("jwt", { dryRun: true });
		expect(out).not.toContain(".env.example");
		expect(out).not.toContain(".gitignore");
	});

	test("existing middleware file: refused before touching env files", async () => {
		await output("jwt");
		await writeFile(join(dir, ".env.example"), "OTHER=\n");
		await expect(output("jwt")).rejects.toThrow(/already exists/);
		expect(await read(".env.example")).toBe("OTHER=\n");
	});
});
