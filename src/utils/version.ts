/**
 * Read the CLI version from package.json — single source of truth.
 *
 * @returns The version string (e.g. "0.1.0")
 *
 * @example
 * ```ts
 * import { getVersion } from "./utils/version.js";
 * console.log(`@bunary/cli v${getVersion()}`);
 * ```
 */

import pkg from "../../package.json";

export function getVersion(): string {
	return pkg.version;
}
