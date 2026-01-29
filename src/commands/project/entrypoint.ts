/**
 * Generate src/index.ts content.
 */
import { loadStub } from "../../utils/stub.js";

export interface EntrypointOptions {
	auth?: "basic" | "jwt";
}

/**
 * Generate entrypoint content, optionally with auth middleware.
 *
 * @param options - When auth is "basic" or "jwt", adds import and app.use(authMiddleware)
 * @returns Entrypoint TypeScript content
 */
export async function generateEntrypoint(
	options?: EntrypointOptions,
): Promise<string> {
	const authImport =
		options?.auth === "basic" || options?.auth === "jwt"
			? 'import { authMiddleware } from "./auth.js";\n\n'
			: "";
	const authUse =
		options?.auth === "basic" || options?.auth === "jwt"
			? "app.use(authMiddleware);\n"
			: "";
	return await loadStub("project/entrypoint.ts", {
		authImport,
		authUse,
	});
}
