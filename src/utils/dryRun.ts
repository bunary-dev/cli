/**
 * Dry-run reporting for scaffolding commands.
 */
import { relative } from "node:path";
import type { CommandFlag } from "../types/command.js";
import { bold, cyan, dim } from "./color.js";

/** Options shared by scaffolding commands. */
export interface DryRunOptions {
	/** Print what would be created instead of writing files. */
	dryRun?: boolean;
	/** With dryRun, also print the full file contents. */
	verbose?: boolean;
}

/** A file a scaffolding command would write. */
export interface PlannedFile {
	/** Absolute path of the file. */
	path: string;
	/** Content that would be written. */
	content: string;
}

/** Flag definitions shared by all scaffolding commands. */
export const dryRunFlags: CommandFlag[] = [
	{
		name: "--dry-run",
		description: "Show what would be created without writing files",
		boolean: true,
	},
	{
		name: "--verbose",
		description: "With --dry-run, also show file contents",
		boolean: true,
	},
];

/** Read dry-run options from parsed CLI flags. */
export function dryRunOptionsFromFlags(
	flags: Record<string, string | boolean>,
): DryRunOptions {
	return { dryRun: flags["dry-run"] === true, verbose: flags.verbose === true };
}

/**
 * Print the files that would be created. Nothing is written.
 *
 * @param files - Planned files (absolute paths)
 * @param baseDir - Paths are displayed relative to this directory
 * @param verbose - Also print file contents
 */
export function reportDryRun(
	files: PlannedFile[],
	baseDir: string,
	verbose = false,
): void {
	console.log(`\n  ${bold("Dry run")} — no files will be written\n`);
	console.log("  Would create:");
	for (const file of files) {
		console.log(`    ${cyan(relative(baseDir, file.path) || file.path)}`);
		if (verbose) {
			for (const line of file.content.split("\n")) {
				console.log(dim(`      │ ${line}`));
			}
		}
	}
	const label = files.length === 1 ? "file" : "files";
	console.log(`\n  ${files.length} ${label} (dry run)\n`);
}
