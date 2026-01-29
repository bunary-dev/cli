/**
 * Generate bunary.config.ts content.
 */
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

const BUNARY_CORE = "@bunary/core";
const BUNARY_CORE_UMBRELLA = "bunary/core";

export async function generateConfig(
	name: string,
	options?: InitOptions,
): Promise<string> {
	const bunaryCore = options?.umbrella ? BUNARY_CORE_UMBRELLA : BUNARY_CORE;
	return await loadStub("project/config.ts", { name, bunaryCore });
}
