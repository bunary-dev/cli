/**
 * Validation and normalization for commands defined outside the CLI.
 *
 * App commands (`BunaryConfig.commands`) and package-contributed commands
 * are written against the `Command` contract in `@bunary/core`, where flag
 * names carry no dashes (`"dry-run"`, alias `"d"`). The CLI registry uses
 * `"--dry-run"` / `"-d"`, so both spellings are accepted and normalized.
 *
 * Core's `CommandFlag` has no `takesValue`, so a value placeholder in the
 * name (`"out <dir>"`) declares a flag that takes a value (#137).
 */
import type {
	Command,
	CommandFlag,
	CoreCommand,
	CoreCommandFlag,
} from "../types/command.js";

/**
 * Find the first required field a command entry is missing or has wrong.
 *
 * @param entry - The value to inspect
 * @returns Field name, or `undefined` if the entry is valid
 *
 * @example
 * ```ts
 * findInvalidField({ name: "seed", description: "Seed", run: async () => {} }); // undefined
 * findInvalidField({ description: "No name" }); // "name"
 * ```
 */
export function findInvalidField(entry: unknown): string | undefined {
	if (typeof entry !== "object" || entry === null) return "name";
	const obj = entry as Record<string, unknown>;
	if (typeof obj.name !== "string" || obj.name.length === 0) return "name";
	if (typeof obj.description !== "string") return "description";
	if (typeof obj.run !== "function") return "run";
	if (obj.flags !== undefined && !Array.isArray(obj.flags)) return "flags";
	if (obj.args !== undefined && !Array.isArray(obj.args)) return "args";
	return undefined;
}

/** Prefix `name` with `dashes` unless it already starts with a dash. */
function withDashes(name: string, dashes: string): string {
	return name.startsWith("-") ? name : `${dashes}${name}`;
}

/** A flag name followed by a value placeholder, e.g. `"out <dir>"`. */
const PLACEHOLDER_NAME = /^(\S+)\s+<([^<>\s]+)>$/;

/**
 * Normalize one flag: dash its name and alias, and turn a `<placeholder>`
 * in the name into `takesValue`.
 */
function normalizeFlag(flag: CoreCommandFlag | CommandFlag): CommandFlag {
	const match = PLACEHOLDER_NAME.exec(flag.name.trim());
	return {
		...flag,
		name: withDashes(match ? (match[1] as string) : flag.name, "--"),
		...(flag.alias ? { alias: withDashes(flag.alias, "-") } : {}),
		...(match ? { takesValue: true, placeholder: match[2] as string } : {}),
	};
}

/**
 * Normalize a valid external command for the registry: default the
 * category and convert core-style flag names to CLI flag names. A flag
 * named `"out <dir>"` becomes `--out` with `takesValue: true`.
 *
 * @param entry - A core (or CLI-style) command that passed {@link findInvalidField}
 * @param defaultCategory - Category to use when the entry has none
 * @returns A registry-ready command
 *
 * @example
 * ```ts
 * normalizeCommand(
 *   { name: "deploy", description: "Deploy", flags: [{ name: "env", alias: "e", description: "Env" }], run },
 *   "project",
 * );
 * // flags: [{ name: "--env", alias: "-e", ... }], category: "project"
 * ```
 */
export function normalizeCommand(
	entry: CoreCommand | Command,
	defaultCategory: string,
): Command {
	const category =
		typeof entry.category === "string" && entry.category.length > 0
			? entry.category
			: defaultCategory;
	const flags = entry.flags?.map(normalizeFlag);
	return { ...entry, category, ...(flags ? { flags } : {}) };
}
