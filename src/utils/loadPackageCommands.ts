/**
 * Discover commands contributed by installed `@bunary/*` packages.
 *
 * A package opts in from its `package.json`:
 *
 * ```json
 * { "name": "@bunary/orm", "bunary": { "commands": "./dist/cli.js" } }
 * ```
 *
 * The module must export a `commands` array (or a default-exported array)
 * of `Command` objects from `@bunary/core`. Only **direct** dependencies of
 * the project (`dependencies` / `devDependencies`) in the `@bunary` scope are
 * considered, so e.g. `make:model` and `db:*` exist only when `@bunary/orm`
 * is installed. A package that fails to load is skipped with a warning; it
 * never stops the CLI.
 */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import type { Command } from "../types/command.js";
import { findInvalidField, normalizeCommand } from "./normalizeCommand.js";

/** Commands contributed by one package. */
export interface PackageCommands {
	/** Package name, e.g. "@bunary/orm" */
	packageName: string;
	/** Validated, normalized commands */
	commands: Command[];
}

/** Packages whose commands are never loaded (the CLI itself). */
const IGNORED = new Set(["@bunary/cli"]);

function readJson(path: string): Record<string, unknown> | undefined {
	try {
		const value = JSON.parse(readFileSync(path, "utf-8"));
		return typeof value === "object" && value !== null ? value : undefined;
	} catch {
		return undefined;
	}
}

/** Direct `@bunary/*` dependencies declared by the project at `cwd`. */
function directBunaryDependencies(cwd: string): string[] {
	const pkg = readJson(join(cwd, "package.json"));
	if (!pkg) return [];
	const names = new Set<string>();
	for (const field of ["dependencies", "devDependencies"]) {
		const deps = pkg[field];
		if (typeof deps !== "object" || deps === null) continue;
		for (const name of Object.keys(deps)) {
			if (name.startsWith("@bunary/") && !IGNORED.has(name)) names.add(name);
		}
	}
	return [...names].sort();
}

/** Find an installed package directory, walking up like Node resolution. */
function findPackageDir(cwd: string, name: string): string | undefined {
	let dir = resolve(cwd);
	for (;;) {
		const candidate = join(dir, "node_modules", ...name.split("/"));
		if (existsSync(join(candidate, "package.json"))) return candidate;
		const parent = dirname(dir);
		if (parent === dir) return undefined;
		dir = parent;
	}
}

function isInside(dir: string, target: string): boolean {
	const rel = relative(dir, target);
	return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/**
 * Load the commands of one package, or `undefined` if it declares none.
 *
 * @throws When the declared module is missing, escapes the package or
 *   fails to import
 */
async function loadFromPackage(
	pkgDir: string,
	packageName: string,
): Promise<Command[] | undefined> {
	const pkg = readJson(join(pkgDir, "package.json"));
	const bunary = pkg?.bunary as Record<string, unknown> | undefined;
	const entry = bunary?.commands;
	if (entry === undefined) return undefined;
	if (typeof entry !== "string" || entry.length === 0) {
		throw new Error(`"bunary.commands" must be a path string`);
	}

	const modulePath = resolve(pkgDir, entry);
	const realDir = realpathSync(pkgDir);
	if (
		!isInside(pkgDir, modulePath) ||
		(existsSync(modulePath) && !isInside(realDir, realpathSync(modulePath)))
	) {
		throw new Error(`"bunary.commands" points outside the package: ${entry}`);
	}

	const mod = await import(modulePath);
	const raw = Array.isArray(mod.commands)
		? mod.commands
		: Array.isArray(mod.default)
			? mod.default
			: undefined;
	if (!raw) {
		throw new Error(
			`${entry} must export a "commands" array (or a default-exported array)`,
		);
	}

	const commands: Command[] = [];
	for (const [index, cmd] of (raw as unknown[]).entries()) {
		const invalid = findInvalidField(cmd);
		if (invalid) {
			console.error(
				`Warning: Skipping commands[${index}] from ${packageName}: missing or invalid "${invalid}"`,
			);
			continue;
		}
		commands.push(normalizeCommand(cmd as Command, packageName));
	}
	return commands;
}

/**
 * Discover and load package-contributed commands for the project at `cwd`.
 *
 * @param cwd - Project root (defaults to `process.cwd()`)
 * @returns One entry per package that contributed at least one command,
 *   sorted by package name
 *
 * @example
 * ```ts
 * for (const { packageName, commands } of await loadPackageCommands()) {
 *   registerCommands(commands, packageName);
 * }
 * ```
 */
export async function loadPackageCommands(
	cwd: string = process.cwd(),
): Promise<PackageCommands[]> {
	const result: PackageCommands[] = [];
	for (const packageName of directBunaryDependencies(cwd)) {
		const pkgDir = findPackageDir(cwd, packageName);
		if (!pkgDir) continue; // declared but not installed yet
		try {
			const commands = await loadFromPackage(pkgDir, packageName);
			if (commands && commands.length > 0) {
				result.push({ packageName, commands });
			}
		} catch (error) {
			console.error(
				`Warning: Failed to load CLI commands from ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
	return result;
}
