/**
 * Generate src/index.ts content.
 */
import { middlewareNameToFunctionName } from "../../utils/naming.js";
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

/**
 * Generate entrypoint content, optionally with auth.
 * init --auth basic|jwt uses the same middleware as make:middleware basic|jwt (basic.ts / jwt.ts).
 *
 * @param options - When auth is "basic" or "jwt", adds `authProvider` and
 *   the middleware file's `authConfig` under the `auth` config key; the
 *   middleware itself protects the /api group (src/routes/groupExample.ts)
 * @returns Entrypoint TypeScript content
 */
export async function generateEntrypoint(
	options?: InitOptions,
): Promise<string> {
	let authProviderImport = "";
	let authImport = "";
	let authComment = "";
	let authProvider = "";
	let appConfig = "config";
	if (options?.auth === "basic" || options?.auth === "jwt") {
		const exportName = middlewareNameToFunctionName(options.auth);
		authProviderImport = `import { authProvider } from "@bunary/auth/provider";\n`;
		authImport = `import { authConfig } from "./middleware/${options.auth}.js";\n`;
		authComment = [
			"",
			`// Auth: authProvider reads the \`auth\` config key (guards from`,
			`// src/middleware/${options.auth}.ts). ${exportName} protects the /api group in`,
			"// src/routes/groupExample.ts; routes outside it are public.",
			"",
		].join("\n");
		authProvider = "authProvider, ";
		appConfig = "config: { ...config, auth: authConfig }";
	}
	return await loadStub("project/entrypoint.ts", {
		authProviderImport,
		authImport,
		authComment,
		authProvider,
		appConfig,
		bunaryCore: "@bunary/core",
		bunaryHttp: "@bunary/http",
	});
}
