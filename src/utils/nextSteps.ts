/**
 * Next-step hints printed after `make` commands.
 *
 * Each function returns a pre-formatted, two-space-indented block
 * ready to be passed to `console.log()` after the success line.
 */

/**
 * Next steps after `make:route`.
 *
 * @param routeName - Route file name (e.g. "users")
 * @param functionName - Register function name (e.g. "registerUsers")
 * @returns Formatted hint string
 *
 * @example
 * ```ts
 * routeNextSteps("users", "registerUsers")
 * // =>
 * //   Next: Add to src/routes/index.ts:
 * //
 * //     import { registerUsers } from "./users.js";
 * //     registerUsers(app);
 * ```
 */
export function routeNextSteps(
	routeName: string,
	functionName: string,
): string {
	return [
		"",
		`  Next: Add to src/routes/index.ts:`,
		"",
		`    import { ${functionName} } from "./${routeName}.js";`,
		`    ${functionName}(app);`,
	].join("\n");
}

/**
 * Next steps after `make:middleware`.
 *
 * @param middlewareName - Middleware file name (e.g. "ensure-auth")
 * @param functionName - Exported function name (e.g. "ensureAuthMiddleware")
 * @returns Formatted hint string
 *
 * @example
 * ```ts
 * middlewareNextSteps("ensure-auth", "ensureAuthMiddleware")
 * // =>
 * //   Next: Register in src/index.ts:
 * //
 * //     import { ensureAuthMiddleware } from "./middleware/ensure-auth.js";
 * //     app.use(ensureAuthMiddleware);
 * ```
 */
export function middlewareNextSteps(
	middlewareName: string,
	functionName: string,
): string {
	return [
		"",
		`  Next: Register in src/index.ts:`,
		"",
		`    import { ${functionName} } from "./middleware/${middlewareName}.js";`,
		`    app.use(${functionName});`,
	].join("\n");
}

/**
 * Next steps after `make:command`.
 *
 * @param fileName - Command file name (e.g. "send-emails")
 * @param exportName - Exported command constant (e.g. "sendEmailsCommand")
 * @returns Formatted hint string
 *
 * @example
 * ```ts
 * commandNextSteps("send-emails", "sendEmailsCommand")
 * // =>
 * //   Next: Register in config/bunary.ts:
 * //
 * //     import { sendEmailsCommand } from "../src/commands/send-emails.js";
 * //     commands: [sendEmailsCommand],
 * ```
 */
export function commandNextSteps(fileName: string, exportName: string): string {
	return [
		"",
		`  Next: Register in config/bunary.ts:`,
		"",
		`    import { ${exportName} } from "../src/commands/${fileName}.js";`,
		`    commands: [${exportName}],`,
	].join("\n");
}

/**
 * Next steps after `make:provider`.
 *
 * @param fileName - Provider file name (e.g. "cache")
 * @param exportName - Exported provider constant (e.g. "cacheProvider")
 * @returns Formatted hint string
 *
 * @example
 * ```ts
 * providerNextSteps("cache", "cacheProvider")
 * // =>
 * //   Next: Add to createApp in src/index.ts:
 * //
 * //     import { cacheProvider } from "./providers/cache.js";
 * //     providers: [cacheProvider],
 * ```
 */
export function providerNextSteps(
	fileName: string,
	exportName: string,
): string {
	return [
		"",
		`  Next: Add to createApp in src/index.ts:`,
		"",
		`    import { ${exportName} } from "./providers/${fileName}.js";`,
		`    providers: [${exportName}],`,
	].join("\n");
}
