/**
 * Naming utilities for converting table names to model names
 */

/**
 * Convert a table name to a PascalCase model name
 *
 * Handles:
 * - snake_case: user_profile → UserProfile
 * - single word: user → User
 * - kebab-case: user-profile → UserProfile
 * - Already PascalCase: UserProfile → UserProfile
 *
 * @param tableName - The database table name
 * @returns PascalCase model name
 *
 * @example
 * ```ts
 * tableNameToModelName("user_profile") // "UserProfile"
 * tableNameToModelName("user") // "User"
 * tableNameToModelName("user-profile") // "UserProfile"
 * ```
 */
export function tableNameToModelName(tableName: string): string {
	if (!tableName || tableName.length === 0) {
		throw new Error("Table name cannot be empty");
	}

	// Split by underscore, hyphen, or capitalize on word boundaries
	const words = tableName
		.split(/[_-]|(?=[A-Z])/)
		.filter((word) => word.length > 0)
		.map((word) => {
			// Capitalize first letter, lowercase the rest
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		});

	return words.join("");
}

/**
 * Convert a route name to the register function name (camelCase).
 * Used for route module stubs: "users" → "registerUsers".
 *
 * @param routeName - The route name (e.g. "users", "user-profile")
 * @returns The register function name (e.g. "registerUsers", "registerUserProfile")
 *
 * @example
 * ```ts
 * routeNameToRegisterFunctionName("users") // "registerUsers"
 * routeNameToRegisterFunctionName("user-profile") // "registerUserProfile"
 * ```
 */
export function routeNameToRegisterFunctionName(routeName: string): string {
	if (!routeName || routeName.length === 0) {
		throw new Error("Route name cannot be empty");
	}
	const pascal = tableNameToModelName(routeName);
	return `register${pascal}`;
}

/**
 * Convert a middleware name to its export function name (camelCase + "Middleware").
 * Laravel-inspired: middleware:make ensure-auth → ensureAuthMiddleware.
 *
 * @param middlewareName - The middleware name (e.g. "ensure-auth", "log-request")
 * @returns The middleware function name (e.g. "ensureAuthMiddleware", "logRequestMiddleware")
 *
 * @example
 * ```ts
 * middlewareNameToFunctionName("ensure-auth") // "ensureAuthMiddleware"
 * middlewareNameToFunctionName("log-request") // "logRequestMiddleware"
 * ```
 */
export function middlewareNameToFunctionName(middlewareName: string): string {
	if (!middlewareName || middlewareName.length === 0) {
		throw new Error("Middleware name cannot be empty");
	}
	const pascal = tableNameToModelName(middlewareName);
	return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}Middleware`;
}
