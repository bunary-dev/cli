/**
 * make:middleware command - scaffold middleware files (Laravel-inspired)
 * init --auth basic|jwt is a shortcut that uses this same content generator.
 */
import type { Command } from "../../types/command.js";
import { dim } from "../../utils/color.js";
import {
	type DryRunOptions,
	dryRunFlags,
	dryRunOptionsFromFlags,
} from "../../utils/dryRun.js";
import { generateFile } from "../../utils/generate.js";
import { middlewareNameToFunctionName } from "../../utils/naming.js";
import { middlewareNextSteps } from "../../utils/nextSteps.js";
import { loadStub } from "../../utils/stub.js";

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
 * Generate a middleware file in src/middleware/.
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
