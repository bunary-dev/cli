/**
 * make:middleware command - scaffold middleware files (Laravel-inspired)
 * init --auth basic|jwt is a shortcut that uses this same content generator.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "../../types/command.js";
import { dim } from "../../utils/color.js";
import {
	type DryRunOptions,
	dryRunFlags,
	dryRunOptionsFromFlags,
	type PlannedFile,
} from "../../utils/dryRun.js";
import { generateFile } from "../../utils/generate.js";
import { middlewareNameToFunctionName } from "../../utils/naming.js";
import { middlewareNextSteps } from "../../utils/nextSteps.js";
import { loadStub } from "../../utils/stub.js";
import { extendEnvExample, generateGitignore } from "../project/env.js";

/**
 * Generate middleware file content. Used by make:middleware and by init --auth.
 * For "basic" and "jwt" uses auth stubs; for other names uses the generic middleware stub.
 *
 * @param middlewareName - e.g. "basic", "jwt", "ensure-auth", "log-request"
 * @returns File content for src/middleware/${middlewareName}.ts
 */
export async function generateMiddlewareContent(
	middlewareName: string,
): Promise<string> {
	const functionName = middlewareNameToFunctionName(middlewareName);

	if (middlewareName === "basic") {
		return await loadStub("middleware/auth-basic.ts", { functionName });
	}
	if (middlewareName === "jwt") {
		return await loadStub("middleware/auth-jwt.ts", { functionName });
	}

	return await loadStub("middleware/make.ts", {
		middlewareName,
		functionName,
	});
}

/**
 * The `.env.example` and `.gitignore` changes the auth middleware needs in
 * an existing project (#153): the same content `init --auth` writes, with
 * only what is missing appended. A real `.env` is never touched.
 *
 * @param auth - Auth middleware type
 * @param cwd - Project root
 * @returns Files to create or update (none when both are up to date)
 */
export async function authEnvFiles(
	auth: "basic" | "jwt",
	cwd: string,
): Promise<PlannedFile[]> {
	const read = async (path: string) =>
		existsSync(path) ? await readFile(path, "utf8") : undefined;
	const files: PlannedFile[] = [];

	const envPath = join(cwd, ".env.example");
	const env = await read(envPath);
	const envContent = await extendEnvExample(auth, env);
	if (envContent !== undefined) {
		files.push({
			path: envPath,
			content: envContent,
			update: env !== undefined,
		});
	}

	const gitignorePath = join(cwd, ".gitignore");
	const gitignore = await read(gitignorePath);
	const gitignoreContent = await generateGitignore(gitignore);
	if (gitignoreContent !== gitignore) {
		files.push({
			path: gitignorePath,
			content: gitignoreContent,
			update: gitignore !== undefined,
		});
	}
	return files;
}

/**
 * Generate a middleware file in src/middleware/.
 * For `basic` / `jwt` also creates or extends `.env.example` and
 * `.gitignore` (see {@link authEnvFiles}).
 * init --auth basic|jwt is equivalent to running make:middleware basic|jwt after init.
 *
 * @param middlewareName - Middleware name (e.g. "basic", "jwt", "ensure-auth")
 * @throws Error if not in a Bunary project, the name is invalid or the
 *   file already exists
 *
 * @example
 * ```ts
 * await makeMiddleware("ensure-auth");
 * await makeMiddleware("jwt");  // same stub as init --auth jwt
 * ```
 */
export async function makeMiddleware(
	middlewareName: string,
	options: DryRunOptions = {},
): Promise<void> {
	const written = await generateFile(
		{
			label: "middleware",
			name: middlewareName,
			dir: ["src", "middleware"],
			render: () => generateMiddlewareContent(middlewareName),
			companions:
				middlewareName === "basic" || middlewareName === "jwt"
					? (cwd) => authEnvFiles(middlewareName, cwd)
					: undefined,
		},
		options,
	);
	if (written) {
		const functionName = middlewareNameToFunctionName(middlewareName);
		console.log(dim(middlewareNextSteps(middlewareName, functionName)));
	}
}

/** Command definition for the registry. */
export const command: Command = {
	name: "make:middleware",
	description: "Generate a middleware",
	category: "scaffold",
	args: [{ name: "name", required: true, description: "Middleware name" }],
	flags: dryRunFlags,
	async run(args, flags) {
		await makeMiddleware(args[0] as string, dryRunOptionsFromFlags(flags));
	},
};
