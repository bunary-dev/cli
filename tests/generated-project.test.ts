/**
 * Generated code compiles against the published packages (#141).
 *
 * Scaffolds real projects with the `bunary` binary (`init`, `init --auth
 * basic|jwt`, then every `make:*` generator), installs the packages they pin
 * (`@bunary/http` `^0.7.1`, the rest `^0.4.0`) from the npm registry and
 * asserts `tsc --noEmit` reports nothing, the entrypoint's imports resolve and
 * the routes answer requests, including a route model binding route (#144).
 * `init --auth basic|jwt` projects are also served for real: `/` stays
 * public and `/api/me` answers 401 (problem+json with a challenge) unless
 * the credentials or the token are valid (#150). They are started the way
 * the printed next steps say, from a `.env` copied from `.env.example`:
 * with the values filled in they serve, left empty they exit naming
 * `.env.example` (#151). A plain `init` project gets the same auth from
 * `make:middleware jwt` plus the registration its next steps print, and is
 * served the same way from the `.env.example` that writes (#153).
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
 * on a router and calls it in-process, so no port is bound. The protected
 * `/api` group of `--auth` projects needs the booted app, so it is only
 * called here for plain `init` (see {@link serveAuthProject}).
 */
const smokeScript = (
	withApi: boolean,
) => `import { createRouter } from "@bunary/http";
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
	${withApi ? 'api: await get("/api/users/7"),' : ""}
	users: await get("/users/3"),
	post: await get("/posts/1"),
	missingPost: await get("/posts/2"),
}));
`;

/** Credentials and secrets the `--auth` tests serve the project with. */
const AUTH_ENV = {
	BASIC_AUTH_USER: "ada",
	BASIC_AUTH_PASSWORD: "correct horse",
	JWT_SECRET: "test-secret-0123456789abcdef0123456789",
};

const basic = (user: string, password: string) =>
	`Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

/** A free TCP port for the served project. */
function freePort(): number {
	const probe = Bun.serve({ port: 0, fetch: () => new Response() });
	const { port } = probe;
	probe.stop(true);
	return port as number;
}

/**
 * Mint JWTs with the project's own `@bunary/auth` through its documented
 * token issuing (`AuthContext.login()` on a JWT guard).
 */
async function mintTokens(app: string) {
	const auth = await import(Bun.resolveSync("@bunary/auth", app));
	const mint = (secret: string, ttlSeconds?: number) =>
		auth
			.createAuthManager({
				defaultGuard: "jwt",
				guards: { jwt: auth.createJwtGuard({ secret, ttlSeconds }) },
			})
			.createContext({ request: new Request("http://localhost/") })
			.login({ id: "ada" }) as Promise<string>;
	const valid = await mint(AUTH_ENV.JWT_SECRET);
	const wrongSecret = await mint("some-other-secret-0123456789abcdef");
	const expired = await mint(AUTH_ENV.JWT_SECRET, 1);
	// Same signature, different claims: claim to be someone else
	const [header, , signature] = valid.split(".");
	const forged = Buffer.from(
		JSON.stringify({ sub: "admin", exp: Math.floor(Date.now() / 1000) + 600 }),
	).toString("base64url");
	const tampered = `${header}.${forged}.${signature}`;
	await Bun.sleep(2_100); // let `expired` pass its exp
	return { valid, wrongSecret, expired, tampered };
}

/** process.env without the auth vars, so only the project's .env sets them. */
function envWithoutAuth(): Record<string, string | undefined> {
	const env: Record<string, string | undefined> = {
		...process.env,
		NO_COLOR: "1",
	};
	for (const key of Object.keys(AUTH_ENV)) delete env[key];
	return env;
}

/**
 * Follow the printed next steps (#151): `cp .env.example .env`, then fill
 * in each empty `KEY=` with the value from AUTH_ENV.
 */
async function writeDotEnv(app: string, filled: boolean): Promise<void> {
	const example = await Bun.file(join(app, ".env.example")).text();
	await writeFile(
		join(app, ".env"),
		filled
			? example.replace(/^(\w+)=$/gm, (line, key: string) =>
					key in AUTH_ENV
						? `${key}="${AUTH_ENV[key as keyof typeof AUTH_ENV]}"`
						: line,
				)
			: example,
	);
}

/**
 * Serve an `--auth` project with its real entrypoint on a free port and
 * check what the scaffold protects. The credentials come from the `.env`
 * copied from `.env.example`; with the values left empty the app exits
 * naming `.env.example` (#151). `prefix` is the protected group.
 */
async function serveAuthProject(
	app: string,
	auth: "basic" | "jwt",
	prefix = "/api",
) {
	const configPath = join(app, "config", "bunary.ts");
	const port = freePort();
	const config = await Bun.file(configPath).text();
	await writeFile(configPath, config.replace("port: 3000", `port: ${port}`));

	await writeDotEnv(app, false);
	const empty = Bun.spawnSync(["bun", "run", "src/index.ts"], {
		cwd: app,
		env: envWithoutAuth(),
		timeout: 30_000,
	});
	expect(empty.exitCode).not.toBe(0);
	expect(empty.stderr.toString()).toContain(
		auth === "basic"
			? "BASIC_AUTH_USER and BASIC_AUTH_PASSWORD are required"
			: "JWT_SECRET is required",
	);
	expect(empty.stderr.toString()).toContain(".env.example");

	await writeDotEnv(app, true);
	const server = Bun.spawn(["bun", "run", "src/index.ts"], {
		cwd: app,
		stdout: "pipe",
		stderr: "pipe",
		env: envWithoutAuth(),
	});
	try {
		const base = `http://localhost:${port}`;
		let up = false;
		for (let i = 0; i < 100 && !up; i++) {
			up = await fetch(`${base}/health`).then(
				(r) => r.ok,
				() => false,
			);
			if (!up) await Bun.sleep(100);
		}
		if (!up) {
			server.kill();
			throw new Error(
				`server did not start:\n${await new Response(server.stderr).text()}`,
			);
		}
		const get = (path: string, authorization?: string) =>
			fetch(`${base}${path}`, {
				headers: authorization ? { authorization } : {},
			});
		const expectUnauthorized = async (res: Response) => {
			expect(res.status).toBe(401);
			expect(res.headers.get("content-type")).toContain(
				"application/problem+json",
			);
			expect(res.headers.get("www-authenticate")).toMatch(
				auth === "basic" ? /^Basic realm="[^"]+"/ : /^Bearer\b/,
			);
			expect(await res.json()).toMatchObject({ status: 401 });
		};

		const home = await get("/");
		expect(home.status).toBe(200);
		expect(await home.json()).toMatchObject({ message: "Welcome to Bunary!" });
		expect((await get("/health")).status).toBe(200);

		await expectUnauthorized(await get(`${prefix}/me`));
		await expectUnauthorized(await get(`${prefix}/health`));

		let ok: Response;
		if (auth === "basic") {
			await expectUnauthorized(
				await get(`${prefix}/me`, basic("ada", "wrong")),
			);
			await expectUnauthorized(
				await get(`${prefix}/me`, basic("eve", AUTH_ENV.BASIC_AUTH_PASSWORD)),
			);
			ok = await get(
				`${prefix}/me`,
				basic(AUTH_ENV.BASIC_AUTH_USER, AUTH_ENV.BASIC_AUTH_PASSWORD),
			);
		} else {
			const tokens = await mintTokens(app);
			for (const bad of [tokens.tampered, tokens.expired, tokens.wrongSecret]) {
				await expectUnauthorized(await get(`${prefix}/me`, `Bearer ${bad}`));
			}
			await expectUnauthorized(await get(`${prefix}/me`, "Bearer not-a-jwt"));
			ok = await get(`${prefix}/me`, `Bearer ${tokens.valid}`);
		}
		expect(ok.status).toBe(200);
		const me = await ok.json();
		expect(me).toEqual({ id: "ada" });
		expect(JSON.stringify(me)).not.toContain(AUTH_ENV.BASIC_AUTH_PASSWORD);
	} finally {
		server.kill();
		await server.exited;
		await writeFile(configPath, config);
	}
}

/**
 * Apply the registration `make:middleware jwt` prints to a plain `init`
 * entrypoint: boot authProvider with the file's authConfig and protect an
 * `/admin` group with jwtMiddleware.
 */
function registerJwt(entrypoint: string): string {
	const steps: Array<[string, string]> = [
		[
			'import config from "../config/bunary.js";',
			`import { authProvider } from "@bunary/auth/provider";
import config from "../config/bunary.js";
import { authConfig, jwtMiddleware } from "./middleware/jwt.js";`,
		],
		[
			"registerRoutes(router);",
			`registerRoutes(router);
router.group({ prefix: "/admin", middleware: [jwtMiddleware] }, (admin) => {
  admin.get("/me", (ctx) => ({ id: (ctx.locals.user as { id: string }).id }));
  admin.get("/health", () => ({ status: "ok" }));
});`,
		],
		["  config,", "  config: { ...config, auth: authConfig },"],
		[
			"providers: [httpProvider(router)],",
			"providers: [authProvider, httpProvider(router)],",
		],
	];
	let result = entrypoint;
	for (const [from, to] of steps) {
		if (!result.includes(from)) throw new Error(`entrypoint lacks: ${from}`);
		result = result.replace(from, to);
	}
	return result;
}

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

				await writeFile(join(app, "smoke.ts"), smokeScript(!auth));
				const smoke = await spawn(
					["bun", "run", "smoke.ts"],
					app,
					auth ? AUTH_ENV : {},
				);
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
				if (!auth) {
					expect(result.api).toEqual({ status: 200, body: { id: "7" } });
				}
				expect(result.users).toEqual({ status: 200, body: { id: "3" } });
				expect(result.post).toEqual({
					status: 200,
					body: { id: 1, title: "Hello" },
				});
				expect(result.missingPost).toMatchObject({
					status: 404,
					body: { status: 404, detail: "post not found" },
				});

				if (auth) await serveAuthProject(app, auth);
			}, 180_000);
		}

		test("init + make:middleware jwt, registered as its next steps say (#153)", async () => {
			const cwd = await makeTempDir("bunary-cli-compile-");
			await bunary(["init", "app", "--no-interactive"], cwd);
			const app = join(cwd, "app");
			expect(await Bun.file(join(app, ".env.example")).exists()).toBe(false);
			await bunary(["make:middleware", "jwt"], app);
			expect(await Bun.file(join(app, ".env.example")).text()).toContain(
				"JWT_SECRET=",
			);

			const add = await spawn(["bun", "add", "@bunary/auth@^0.4.0"], app);
			expect(add.code, add.output).toBe(0);
			await writeFile(
				join(app, "src", "index.ts"),
				registerJwt(await Bun.file(join(app, "src", "index.ts")).text()),
			);

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

			await serveAuthProject(app, "jwt", "/admin");
		}, 180_000);
	},
);
