/**
 * Generate src/routes/ file contents.
 */
import { middlewareNameToFunctionName } from "../../utils/naming.js";
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

const BUNARY_HTTP = "@bunary/http";

export async function generateRoutesMain(
	_options?: InitOptions,
): Promise<string> {
	return await loadStub("project/routes/main.ts", { bunaryHttp: BUNARY_HTTP });
}

/**
 * The /api group example. With `--auth basic|jwt` the group requires auth
 * (the middleware from src/middleware/<auth>.ts) and adds GET /api/me.
 */
export async function generateRoutesGroupExample(
	options?: InitOptions,
): Promise<string> {
	if (options?.auth === "basic" || options?.auth === "jwt") {
		return await loadStub("project/routes/groupExampleAuth.ts", {
			bunaryHttp: BUNARY_HTTP,
			auth: options.auth,
			authLabel:
				options.auth === "basic"
					? "Basic auth credentials"
					: "a valid JWT (Bearer token)",
			functionName: middlewareNameToFunctionName(options.auth),
		});
	}
	return await loadStub("project/routes/groupExample.ts", {
		bunaryHttp: BUNARY_HTTP,
	});
}

export async function generateRoutesIndex(
	_options?: InitOptions,
): Promise<string> {
	return await loadStub("project/routes/index.ts", {
		bunaryHttp: BUNARY_HTTP,
	});
}
