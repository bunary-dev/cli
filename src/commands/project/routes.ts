/**
 * Generate src/routes/ file contents.
 */
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

const BUNARY_HTTP = "@bunary/http";

export async function generateRoutesMain(
	_options?: InitOptions,
): Promise<string> {
	return await loadStub("project/routes/main.ts", { bunaryHttp: BUNARY_HTTP });
}

export async function generateRoutesGroupExample(
	_options?: InitOptions,
): Promise<string> {
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
