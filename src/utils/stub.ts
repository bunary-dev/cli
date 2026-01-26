/**
 * Stub utility functions for loading and processing template files
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Get the directory where stub files are located
 * Works in both development (src/) and production (dist/) builds
 */
function getStubsDir(): string {
	const currentFile = fileURLToPath(import.meta.url);
	// In development: currentFile is in src/utils/stub.js
	// In production (bundled): currentFile is in dist/index.js
	// In production (unbundled): currentFile is in dist/utils/stub.js
	
	let baseDir: string;
	
	// Check if we're in a bundled file (index.js)
	if (currentFile.endsWith("index.js")) {
		// Bundled: stubs are in the same directory as index.js
		baseDir = dirname(currentFile); // dist/
	} else {
		// Unbundled or dev: go up from utils/ to base
		const utilsDir = dirname(currentFile); // src/utils or dist/utils
		baseDir = dirname(utilsDir); // src or dist
	}
	
	return join(baseDir, "stubs");
}

/**
 * Load a stub file and replace placeholders with provided values
 *
 * @param stubPath - Relative path to stub file (e.g., "model/make.ts")
 * @param replacements - Object with placeholder keys and replacement values
 * @returns Processed stub content with placeholders replaced
 *
 * @example
 * ```ts
 * const content = await loadStub("model/make.ts", {
 *   modelName: "User",
 *   tableName: "users"
 * });
 * ```
 */
export async function loadStub(
	stubPath: string,
	replacements: Record<string, string>,
): Promise<string> {
	const stubsDir = getStubsDir();
	const fullPath = join(stubsDir, stubPath);

	try {
		const file = Bun.file(fullPath);
		let content = await file.text();

		// Replace all placeholders in the format {{key}}
		for (const [key, value] of Object.entries(replacements)) {
			const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
			content = content.replace(placeholder, value);
		}

		return content;
	} catch (error) {
		throw new Error(
			`Failed to load stub file: ${stubPath}\n${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
