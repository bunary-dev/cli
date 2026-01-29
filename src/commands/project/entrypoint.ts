/**
 * Generate src/index.ts content.
 */
import { middlewareNameToFunctionName } from "../../utils/naming.js";
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

/**
 * Generate entrypoint content, optionally with auth middleware.
 * init --auth basic|jwt uses the same middleware as middleware:make basic|jwt (basic.ts / jwt.ts).
 *
 * @param options - When auth is "basic" or "jwt", adds import and app.use(basicMiddleware|jwtMiddleware)
 * @returns Entrypoint TypeScript content
 */
const BUNARY_HTTP = "@bunary/http";
const BUNARY_HTTP_UMBRELLA = "bunary/http";

export async function generateEntrypoint(
	options?: InitOptions,
): Promise<string> {
	let authImport = "";
	let authUse = "";
	if (options?.auth === "basic" || options?.auth === "jwt") {
		const exportName = middlewareNameToFunctionName(options.auth);
		authImport = `import { ${exportName} } from "./middleware/${options.auth}.js";\n\n`;
		authUse = `app.use(${exportName});\n`;
	}
	const bunaryHttp = options?.umbrella ? BUNARY_HTTP_UMBRELLA : BUNARY_HTTP;
	return await loadStub("project/entrypoint.ts", {
		authImport,
		authUse,
		bunaryHttp,
	});
}
