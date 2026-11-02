/**
 * Generated code compiles against the published packages (#141).
 *
 * Scaffolds real projects with the `bunary` binary (`init`, `init --auth
 * basic|jwt`, then every `make:*` generator), installs the packages they pin
 * (`@bunary/http` `^0.7.1`, the rest `^0.4.0`) from the npm registry and
 * asserts `tsc --noEmit` reports nothing, the entrypoint's imports resolve and
 * the routes answer requests, including a route model binding route (#144).
 *
 * Needs the network. Offline (or with BUNARY_SKIP_NETWORK_TESTS=1) the tests
 * are skipped and say why.
 */
import { describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeTempDir } from "./helpers/temp-dir.js";

const root = join(import.meta.dir, "..");
const bin = join(root, "src", "bin.ts");
const REGISTRY = "https://registry.npmjs.org/@bunary%2fhttp";

/** Minor each scaffolded `@bunary/*` package must resolve to. */
const INSTALLED: Record<string, RegExp> = {
	core: /^0\.4\./,
	http: /^0\.7\.([1-9]|\d{2,})/,
	auth: /^0\.4\./,
};

/**
 * A route using route model binding (`bind` / `ctx.bound`, @bunary/http
 * 0.7.1+), added to the generated project so it is typechecked and served.
 */
const POSTS_ROUTE = `import type { Router } from "@bunary/http";

const posts = new Map([[1, { id: 1, title: "Hello" }]]);

export function registerPosts(router: Router): void {
	router.get(
		"/posts/:post",
		{ bind: { post: (id) => posts.get(Number(id)) } },
		(ctx) => ({ id: ctx.bound.post.id, title: ctx.bound.post.title }),
	);
}
`;

async function registryReachable(): Promise<boolean> {
	if (process.env.BUNARY_SKIP_NETWORK_TESTS === "1") return false;
	try {
		const res = await fetch(REGISTRY, {
			method: "HEAD",
			signal: AbortSignal.timeout(5_000),
		});
		return res.ok;
	} catch {
		return false;
	}
}

const online = await registryReachable();
if (!online) {
	console.warn(
		"[generated-project.test] skipped: registry.npmjs.org is unreachable " +
			"(or BUNARY_SKIP_NETWORK_TESTS=1), so the published @bunary/* packages " +
			"cannot be installed to typecheck generated projects.",
	);
}

async function spawn(
	cmd: string[],
	cwd: string,
	env: Record<string, string> = {},
) {
	const proc = Bun.spawn(cmd, {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
		env: { ...process.env, NO_COLOR: "1", ...env },
	});
	const [stdout, stderr, code] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { stdout, stderr, code, output: stdout + stderr };
}

async function bunary(args: string[], cwd: string): Promise<void> {
	const res = await spawn(["bun", bin, ...args], cwd);
	if (res.code !== 0)
		throw new Error(`bunary ${args.join(" ")}:\n${res.output}`);
}

/**
 * Smoke script run inside the generated project: mounts the generated routes
 * on a router and calls it in-process, so no port is bound.
 */
const SMOKE = `import { createRouter } from "@bunary/http";
import config from "./config/bunary.js";
import { registerRoutes } from "./src/routes/index.js";
import { registerUsers } from "./src/routes/users.js";
import { registerPosts } from "./src/routes/posts.js";

const router = createRouter();
registerRoutes(router);
registerUsers(router);
registerPosts(router);
const get = async (path: string) => {
	const res = await router.fetch(new Request("http://localhost" + path));
	return { status: res.status, body: await res.json() };
};
console.log(JSON.stringify({
	name: config.app.name,
	port: config.http?.port,
	home: await get("/"),
	health: await get("/health"),
	api: await get("/api/users/7"),
	users: await get("/users/3"),
	post: await get("/posts/1"),
	missingPost: await get("/posts/2"),
}));
`;

describe.skipIf(!online)(
	"generated projects compile against the @bunary/* versions init pins",
	() => {
		for (const auth of [undefined, "basic", "jwt"] as const) {
			const label = auth ? `init --auth ${auth}` : "init";

			test(`${label} + make:route/middleware/command/provider`, async () => {
				const cwd = await makeTempDir("bunary-cli-compile-");
				await bunary(
					[
						"init",
						"app",
						"--no-interactive",
						...(auth ? ["--auth", auth] : []),
					],
					cwd,
				);
				const app = join(cwd, "app");
				await bunary(["make:route", "users"], app);
				await bunary(["make:middleware", "log-request"], app);
				await bunary(["make:command", "send-emails"], app);
				await bunary(["make:provider", "cache"], app);
				await writeFile(join(app, "src", "routes", "posts.ts"), POSTS_ROUTE);

				const install = await spawn(["bun", "install"], app);
				expect(install.code, install.output).toBe(0);
				for (const pkg of ["core", "http", ...(auth ? ["auth"] : [])]) {
					const installed = await Bun.file(
						join(app, "node_modules", "@bunary", pkg, "package.json"),
					).json();
					expect(installed.version).toMatch(INSTALLED[pkg] as RegExp);
				}

				const tsc = await spawn(
					[
						"bun",
						join(app, "node_modules", "typescript", "bin", "tsc"),
						"--noEmit",
					],
					app,
				);
				expect(tsc.output).toBe("");
				expect(tsc.code).toBe(0);

				// Every import of the entrypoint resolves (bundling does not run it,
				// so the server never starts).
				const build = await spawn(
					[
						"bun",
						"build",
						"src/index.ts",
						"--target",
						"bun",
						"--outdir",
						"dist",
					],
					app,
				);
				expect(build.code, build.output).toBe(0);

				await writeFile(join(app, "smoke.ts"), SMOKE);
				const smoke = await spawn(["bun", "run", "smoke.ts"], app);
				expect(smoke.code, smoke.output).toBe(0);
				const result = JSON.parse(smoke.stdout.trim());
				expect(result.name).toBe("app");
				expect(result.port).toBe(3000);
				expect(result.home).toMatchObject({
					status: 200,
					body: { message: "Welcome to Bunary!" },
				});
				expect(result.health).toMatchObject({
					status: 200,
					body: { status: "ok" },
				});
				expect(result.api).toEqual({ status: 200, body: { id: "7" } });
				expect(result.users).toEqual({ status: 200, body: { id: "3" } });
				expect(result.post).toEqual({
					status: 200,
					body: { id: 1, title: "Hello" },
				});
				expect(result.missingPost).toMatchObject({
					status: 404,
					body: { status: 404, detail: "post not found" },
				});
			}, 180_000);
		}
	},
);
