/**
 * @bunary/cli library entry. Importing it has no side effects: the
 * executable is `bin.ts`, which calls {@link run}.
 *
 * @example
 * ```ts
 * import { run } from "@bunary/cli";
 *
 * const code = await run(["make:route", "users", "--dry-run"]);
 * ```
 */

export { run } from "./cli.js";
export type {
	Command,
	CommandArg,
	CommandCategory,
	CommandFlag,
} from "./types/command.js";
