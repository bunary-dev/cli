/**
 * Shared types for init command and project generators.
 */

/** Options for `bunary init` (e.g. auth scaffolding). */
export interface InitOptions {
	auth?: "basic" | "jwt";
}
