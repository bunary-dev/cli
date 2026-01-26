/**
 * Validation utilities for CLI commands
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Check if current directory is a Bunary project
 *
 * Validates that:
 * - package.json exists
 * - package.json contains @bunary/core dependency
 *
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns true if valid Bunary project, false otherwise
 *
 * @example
 * ```ts
 * if (!isBunaryProject()) {
 *   console.error("Error: Not in a Bunary project");
 *   process.exit(1);
 * }
 * ```
 */
export function isBunaryProject(cwd: string = process.cwd()): boolean {
	const packageJsonPath = join(cwd, "package.json");

	// Check if package.json exists
	if (!existsSync(packageJsonPath)) {
		return false;
	}

	try {
		const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
		const packageJson = JSON.parse(packageJsonContent);

		// Check if @bunary/core is in dependencies or devDependencies
		const hasCore =
			packageJson.dependencies?.["@bunary/core"] ||
			packageJson.devDependencies?.["@bunary/core"];

		return !!hasCore;
	} catch {
		// If package.json is invalid JSON, it's not a valid project
		return false;
	}
}
