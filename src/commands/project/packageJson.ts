/**
 * Generate package.json content for a new project.
 */
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

/** @bunary/auth version for init --auth. Update when publishing a new auth release. */
const BUNARY_AUTH_VERSION = "^0.0.7";

/** Umbrella package version for init --umbrella. Sync with umbrella package release. */
const BUNARY_UMBRELLA_VERSION = "^0.0.1";

/**
 * Generate package.json content.
 *
 * @param name - Project name
 * @param options - Optional init options (auth, umbrella) to set dependencies
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
	if (options?.umbrella) {
		parsed.dependencies = { bunary: BUNARY_UMBRELLA_VERSION };
	}
	if (options?.auth === "basic" || options?.auth === "jwt") {
		parsed.dependencies = parsed.dependencies ?? {};
		parsed.dependencies["@bunary/auth"] = BUNARY_AUTH_VERSION;
	}
	const out = `${JSON.stringify(parsed, null, 2)}\n`;
	return out;
}
