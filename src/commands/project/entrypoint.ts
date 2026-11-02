/**
 * Generate src/index.ts content.
 */
import { middlewareNameToFunctionName } from "../../utils/naming.js";
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

/**
 * Generate entrypoint content, optionally with auth middleware.
 * init --auth basic|jwt uses the same middleware as make:middleware basic|jwt (basic.ts / jwt.ts).
 *
 * @param options - When auth is "basic" or "jwt", types the router with
 *   `AuthLocals` and adds the import and router.use(basicMiddleware|jwtMiddleware)
 * @returns Entrypoint TypeScript content
 */
export async function generateEntrypoint(
	options?: InitOptions,
): Promise<string> {
	let authTypeImport = "";
	let authImport = "";
	let authUse = "";
	let routerLocals = "";
	if (options?.auth === "basic" || options?.auth === "jwt") {
		const exportName = middlewareNameToFunctionName(options.auth);
		authTypeImport = `import type { AuthLocals } from "@bunary/auth";\n`;
		authImport = `import { ${exportName} } from "./middleware/${options.auth}.js";\n`;
		authUse = `router.use(${exportName});\n`;
		routerLocals = "<AuthLocals>";
	}
	return await loadStub("project/entrypoint.ts", {
		authTypeImport,
		authImport,
		authUse,
		routerLocals,
		bunaryCore: "@bunary/core",
		bunaryHttp: "@bunary/http",
	});
}
