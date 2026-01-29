import { middlewareNameToFunctionName } from "../../utils/naming.js";
/**
 * Generate src/index.ts content.
 */
import { loadStub } from "../../utils/stub.js";

export interface EntrypointOptions {
	auth?: "basic" | "jwt";
}

/**
 * Generate entrypoint content, optionally with auth middleware.
 * init --auth basic|jwt uses the same middleware as make:middleware basic|jwt (basic.ts / jwt.ts).
 *
 * @param options - When auth is "basic" or "jwt", adds import and app.use(basicMiddleware|jwtMiddleware)
 * @returns Entrypoint TypeScript content
 */
export async function generateEntrypoint(
	options?: EntrypointOptions,
): Promise<string> {
	let authImport = "";
	let authUse = "";
	if (options?.auth === "basic" || options?.auth === "jwt") {
		const exportName = middlewareNameToFunctionName(options.auth);
		authImport = `import { ${exportName} } from "./middleware/${options.auth}.js";\n\n`;
		authUse = `app.use(${exportName});\n`;
	}
	return await loadStub("project/entrypoint.ts", {
		authImport,
		authUse,
	});
}
