/**
 * Next-step hints printed after `make` commands.
 *
 * Each function returns a pre-formatted, two-space-indented block
 * ready to be passed to `console.log()` after the success line.
 */

/**
 * Next steps after `route:make`.
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
 * Next steps after `middleware:make`.
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
 * Next steps after `model:make`.
 *
 * @param _tableName - Database table name (e.g. "users")
 * @param modelName - PascalCase model class name (e.g. "Users")
 * @returns Formatted hint string
 *
 * @example
 * ```ts
 * modelNextSteps("users", "Users")
 * // =>
 * //   Next: Import where needed:
 * //
 * //     import { Users } from "./models/Users.js";
 * //     const records = await Users.all();
 * ```
 */
export function modelNextSteps(_tableName: string, modelName: string): string {
	return [
		"",
		`  Next: Import where needed:`,
		"",
		`    import { ${modelName} } from "./models/${modelName}.js";`,
		`    const records = await ${modelName}.all();`,
	].join("\n");
}

/**
 * Next steps after `migration:make`.
 *
 * @returns Formatted hint string
 *
 * @example
 * ```ts
 * migrationNextSteps()
 * // =>
 * //   Next: Run the migration:
 * //
 * //     bunary migrate
 * ```
 */
export function migrationNextSteps(): string {
	return ["", `  Next: Run the migration:`, "", `    bunary migrate`].join(
		"\n",
	);
}
