import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { listStubs, loadStub } from "../../src/utils/stub.js";
import { makeTempDirSync } from "../helpers/temp-dir.js";

const pkgRoot = join(import.meta.dir, "../..");
const stubsRoot = join(pkgRoot, "stubs");

describe("embedded stubs", () => {
	test("every stub file on disk is embedded", async () => {
		const onDisk: string[] = [];
		for await (const file of new Bun.Glob("**/*.stub").scan(stubsRoot)) {
			onDisk.push(file.replace(/\.stub$/, ""));
		}
		expect(listStubs().sort()).toEqual(onDisk.sort());
	});

	test("embedded content matches the stub file", async () => {
		const disk = await Bun.file(join(stubsRoot, "route/make.ts.stub")).text();
		expect(await loadStub("route/make.ts", {})).toBe(disk);
	});

	test("throws for an unknown stub", async () => {
		await expect(loadStub("nope/missing.ts", {})).rejects.toThrow(
			/nope\/missing\.ts/,
		);
	});
});

describe("loadStub replacement", () => {
	test("does not expand $ patterns in values", async () => {
		const out = await loadStub("route/make.ts", { routeName: "a$&b$'c" });
		expect(out).toContain("a$&b$'c");
	});
});

describe("bundled CLI", () => {
	test("generates a project with no stubs directory on disk", async () => {
		const tmp = makeTempDirSync("bunary-cli-bundle-");
		const outdir = join(tmp, "bundle");
		const build = await Bun.build({
			entrypoints: [join(pkgRoot, "src/bin.ts")],
			outdir,
			target: "bun",
		});
		expect(build.success).toBe(true);
		const bin = build.outputs.find((o) => o.kind === "entry-point");
		expect(bin).toBeDefined();
		expect(relative(pkgRoot, bin?.path ?? "").startsWith("..")).toBe(true);

		const proc = Bun.spawnSync(["bun", bin?.path ?? "", "init", "app"], {
			cwd: tmp,
		});
		expect(proc.stderr.toString()).toBe("");
		expect(proc.exitCode).toBe(0);
		expect(existsSync(join(tmp, "app", "src", "routes", "main.ts"))).toBe(true);
	}, 30_000);
});
