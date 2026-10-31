/**
 * Stub utility functions for loading and processing template files
 */
import { STUBS } from "./stubRegistry.js";

/**
 * List the embedded stub paths (e.g. "route/make.ts").
 */
export function listStubs(): string[] {
	return Object.keys(STUBS);
}

/**
 * Load a stub file and replace placeholders with provided values
 *
 * @param stubPath - Relative path to stub file (e.g., "route/make.ts")
 * @param replacements - Object with placeholder keys and replacement values
 * @returns Processed stub content with placeholders replaced
 *
 * @example
 * ```ts
 * const content = await loadStub("route/make.ts", {
 *   routeName: "users",
 *   functionName: "registerUsers",
 * });
 * ```
 */
export async function loadStub(
	stubPath: string,
	replacements: Record<string, string>,
): Promise<string> {
	let content = STUBS[stubPath];
	if (content === undefined) {
		throw new Error(`Failed to load stub file: ${stubPath}\nUnknown stub`);
	}

	// Replace all placeholders in the format {{key}}
	for (const [key, value] of Object.entries(replacements)) {
		const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
		content = content.replace(placeholder, () => value);
	}

	return content;
}
