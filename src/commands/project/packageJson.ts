/**
 * Generate package.json content for a new project.
 */
import { loadStub } from "../../utils/stub.js";

export interface InitOptions {
	auth?: "basic" | "jwt";
}

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
		parsed.dependencies["@bunary/auth"] = "^0.0.7";
	}
	const out = `${JSON.stringify(parsed, null, 2)}\n`;
	return out;
}
