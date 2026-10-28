/**
 * Validation utilities for CLI commands
 */

import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

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
 * Throw if `name` cannot be safely used as a file name and identifier base.
 * Must start with a letter and contain only letters, digits, `_` or `-`.
 *
 * @param name - User-supplied name
 * @param label - Human-readable kind used in the message (e.g. "route")
 * @throws When the name is invalid
 */
export function validateMakeName(name: string, label: string): void {
	if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name ?? "")) {
		throw new Error(
			`Error: Invalid ${label} name "${name}".\n` +
				"Names must start with a letter and contain only letters, digits, underscores and hyphens (no path separators, dots or whitespace).",
		);
	}
}

/** Whether `target` is strictly below `dir` (both absolute). */
function isStrictlyInside(dir: string, target: string): boolean {
	const rel = relative(dir, target);
	return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/** Whether something (even a dangling symlink) exists at `path`. */
function lexists(path: string): boolean {
	try {
		lstatSync(path);
		return true;
	} catch {
		return false;
	}
}

/**
 * Throw if writing `target` would land outside the project at `root`.
 *
 * Checks the path as written, then again with symlinks resolved: the
 * deepest part of `target` that already exists is passed through
 * `realpath`, so a `src/routes` symlink (or a dangling symlink at the
 * target itself) pointing out of the project is refused as well.
 *
 * @param root - Project root directory
 * @param target - Absolute path of the file about to be written
 * @throws When the path, or the location it resolves to, escapes `root`
 *
 * @example
 * ```ts
 * assertInsideProject(cwd, join(cwd, "src", "routes", "users.ts")); // ok
 * assertInsideProject(cwd, join(cwd, "..", "users.ts")); // throws
 * ```
 */
export function assertInsideProject(root: string, target: string): void {
	const absRoot = resolve(root);
	const absTarget = resolve(target);
	const refuse = (): never => {
		throw new Error(
			`Error: Refusing to write outside the project (${absRoot}): ${absTarget}`,
		);
	};

	if (!isStrictlyInside(absRoot, absTarget)) refuse();

	let existing = absTarget;
	while (!lexists(existing)) existing = dirname(existing);

	let realExisting: string | undefined;
	try {
		realExisting = realpathSync(existing);
	} catch {
		// Dangling symlink: writing would follow it to an unknown location
	}
	if (realExisting === undefined) refuse();
	const realTarget = join(
		realExisting as string,
		relative(existing, absTarget),
	);
	if (!isStrictlyInside(realpathSync(absRoot), realTarget)) refuse();
}
