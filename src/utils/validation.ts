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

/**
 * Throw if `cwd` is not inside a Bunary project.
 *
 * Use this at the top of every command that operates on an existing
 * project. Centralises the guard so the error message stays consistent
 * and each command doesn't have to duplicate the check.
 *
 * @param cwd - Directory to check (defaults to process.cwd())
 * @throws When the directory is not a Bunary project
 *
 * @example
 * ```ts
 * ensureBunaryProject();          // throws if cwd isn't a project
 * ensureBunaryProject("/tmp/x");  // throws if /tmp/x isn't a project
 * ```
 */
export function ensureBunaryProject(cwd: string = process.cwd()): void {
	if (!isBunaryProject(cwd)) {
		throw new Error(
			"Error: Not in a Bunary project.\n" +
				"Make sure you're in a directory with package.json containing @bunary/core dependency.",
		);
	}
}

/**
 * Throw if the project at `cwd` does not depend on `@bunary/orm`.
 *
 * Reads `package.json` and checks both `dependencies` and
 * `devDependencies`. Also calls {@link ensureBunaryProject} first,
 * so callers don't need two separate guards.
 *
 * @param cwd - Directory to check (defaults to process.cwd())
 * @throws When the project is missing `@bunary/orm`
 *
 * @example
 * ```ts
 * ensureOrmDependency();  // throws if @bunary/orm not installed
 * ```
 */
export function ensureOrmDependency(cwd: string = process.cwd()): void {
	ensureBunaryProject(cwd);

	const pkgPath = join(cwd, "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const hasOrm =
		pkg.dependencies?.["@bunary/orm"] || pkg.devDependencies?.["@bunary/orm"];

	if (!hasOrm) {
		throw new Error(
			"Error: Project must have @bunary/orm in dependencies.\n" +
				"Run: bun add @bunary/orm",
		);
	}
}
