/**
 * Generate src/routes/ file contents.
 */
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

function bunaryHttpReplacement(options?: InitOptions): Record<string, string> {
	const bunaryHttp = options?.umbrella ? "bunary/http" : "@bunary/http";
	return { bunaryHttp };
}

export async function generateRoutesMain(
	options?: InitOptions,
): Promise<string> {
	return await loadStub(
		"project/routes/main.ts",
		bunaryHttpReplacement(options),
	);
}

export async function generateRoutesGroupExample(
	options?: InitOptions,
): Promise<string> {
	return await loadStub(
		"project/routes/groupExample.ts",
		bunaryHttpReplacement(options),
	);
}

export async function generateRoutesIndex(
	options?: InitOptions,
): Promise<string> {
	return await loadStub(
		"project/routes/index.ts",
		bunaryHttpReplacement(options),
	);
}
