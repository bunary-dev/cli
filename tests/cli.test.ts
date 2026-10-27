import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const entry = join(import.meta.dir, "..", "src", "index.ts");

async function cli(...args: string[]) {
	const cwd = mkdtempSync(join(tmpdir(), "bunary-cli-"));
	const proc = Bun.spawn(["bun", entry, ...args], {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});
	const [stdout, stderr, code] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { stdout, stderr, code, cwd };
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
});
