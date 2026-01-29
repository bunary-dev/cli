/**
 * Shared types for init command and project generators.
 */

/** Options for `bunary init` (e.g. auth scaffolding, umbrella package). */
export interface InitOptions {
	auth?: "basic" | "jwt";
	/** Use umbrella `bunary` package instead of individual @bunary/* deps. */
	umbrella?: boolean;
}
