/**
 * Stub utility functions for loading and processing template files
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Find the stubs directory by walking up from a starting directory.
 * Works for dev (src/utils -> package root), bundled (dist) and unbundled
 * (dist/utils) layouts regardless of the bundle's file name.
 *
 * @param startDir - Directory to begin searching from
 * @throws Error if no `stubs` directory exists in startDir or its ancestors
 */
export function findStubsDir(startDir: string): string {
	let dir = startDir;
	for (;;) {
		const candidate = join(dir, "stubs");
		if (existsSync(candidate)) return candidate;
		const parent = dirname(dir);
		if (parent === dir) {
			throw new Error(`Could not locate stubs directory from ${startDir}`);
		}
		dir = parent;
	}
}

/**
 * Get the directory where stub files are located
 * In development: stubs are at package root (stubs/).
 * In production: stubs are copied to dist/stubs/.
 */
export function getStubsDir(): string {
	return findStubsDir(dirname(fileURLToPath(import.meta.url)));
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
			content = content.replace(placeholder, () => value);
		}

		return content;
	} catch (error) {
		throw new Error(
			`Failed to load stub file: ${stubPath}\n${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
