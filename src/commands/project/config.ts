/**
 * Generate bunary.config.ts content.
 */
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

export async function generateConfig(
	name: string,
	_options?: InitOptions,
): Promise<string> {
	return await loadStub("project/config.ts", {
		name,
		bunaryCore: "@bunary/core",
	});
}
