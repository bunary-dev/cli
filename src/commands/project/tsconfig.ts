/**
 * Generate tsconfig.json content for a new project.
 */
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

export async function generateTsconfig(
	_options?: InitOptions,
): Promise<string> {
	return await loadStub("project/tsconfig.ts", {});
}
