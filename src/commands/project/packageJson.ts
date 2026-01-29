/**
 * Generate package.json content for a new project.
 */
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

/** @bunary/auth version for init --auth. Update when publishing a new auth release. */
const BUNARY_AUTH_VERSION = "^0.0.7";

/**
 * Generate package.json content.
 *
 * @param name - Project name
 * @param options - Optional init options (e.g. auth) to add @bunary/auth dependency
 * @returns JSON string
 */
export async function generatePackageJson(
	name: string,
	options?: InitOptions,
): Promise<string> {
	const content = await loadStub("project/packageJson.ts", { name });
	const parsed = JSON.parse(content) as Record<string, unknown> & {
		dependencies?: Record<string, string>;
	};
	if (options?.auth === "basic" || options?.auth === "jwt") {
		parsed.dependencies = parsed.dependencies ?? {};
		parsed.dependencies["@bunary/auth"] = BUNARY_AUTH_VERSION;
	}
	const out = `${JSON.stringify(parsed, null, 2)}\n`;
	return out;
}
