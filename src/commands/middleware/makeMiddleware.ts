/**
 * middleware:make command - scaffold middleware files (Laravel-inspired)
 * init --auth basic|jwt is a shortcut that uses this same content generator.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "../../types/command.js";
import { cyan, green } from "../../utils/color.js";
import { middlewareNameToFunctionName } from "../../utils/naming.js";
import { loadStub } from "../../utils/stub.js";
import { ensureBunaryProject } from "../../utils/validation.js";

/**
 * Generate middleware file content. Used by middleware:make and by init --auth.
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
 * Generate a middleware file in src/middleware/.
 * init --auth basic|jwt is equivalent to running middleware:make basic|jwt after init.
 *
 * @param middlewareName - Middleware name (e.g. "basic", "jwt", "ensure-auth")
 * @throws Error if not in a Bunary project or file already exists
 *
 * @example
 * ```ts
 * await makeMiddleware("ensure-auth");
 * await makeMiddleware("jwt");  // same stub as init --auth jwt
 * ```
 */
export async function makeMiddleware(middlewareName: string): Promise<void> {
	const cwd = process.cwd();
	ensureBunaryProject(cwd);

	const middlewareDir = join(cwd, "src", "middleware");
	const middlewarePath = join(middlewareDir, `${middlewareName}.ts`);

	if (existsSync(middlewarePath)) {
		throw new Error(
			`Error: Middleware ${middlewareName} already exists at ${middlewarePath}\nDelete the existing file if you want to regenerate it.`,
		);
	}

	await mkdir(middlewareDir, { recursive: true });

	const content = await generateMiddlewareContent(middlewareName);

	await writeFile(middlewarePath, content, "utf-8");

	console.log(green(`✅ Created middleware: ${cyan(middlewarePath)}`));
}

/** Command definition for the registry. */
export const command: Command = {
	name: "middleware:make",
	description: "Generate a middleware",
	category: "scaffold",
	args: [{ name: "name", required: true, description: "Middleware name" }],
	async run(args) {
		await makeMiddleware(args[0]);
	},
};
