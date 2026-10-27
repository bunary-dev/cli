/**
 * Shared types for init command and project generators.
 */

/** Options for `bunary init` (e.g. auth scaffolding). */
export interface InitOptions {
	auth?: "basic" | "jwt";
	/** Overwrite existing files instead of aborting. */
	force?: boolean;
	/** Print what would be created without writing files. */
	dryRun?: boolean;
	/** With dryRun, also print file contents. */
	verbose?: boolean;
}
