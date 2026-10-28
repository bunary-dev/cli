/**
 * Naming utilities for turning generator names into identifiers
 */

/**
 * Convert a name to PascalCase
 *
 * Handles:
 * - snake_case: user_profile → UserProfile
 * - single word: user → User
 * - kebab-case: user-profile → UserProfile
 * - Already PascalCase: UserProfile → UserProfile
 *
 * @param name - The name to convert
 * @returns PascalCase name
 *
 * @example
 * ```ts
 * toPascalCase("user_profile") // "UserProfile"
 * toPascalCase("user") // "User"
 * toPascalCase("user-profile") // "UserProfile"
 * ```
 */
export function toPascalCase(name: string): string {
	if (!name || name.length === 0) {
		throw new Error("Name cannot be empty");
	}

	// Split by underscore, hyphen, or capitalize on word boundaries
	const words = name
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
	const pascal = toPascalCase(routeName);
	return `register${pascal}`;
}

/**
 * Convert a middleware name to its export function name (camelCase + "Middleware").
 * Laravel-inspired: make:middleware ensure-auth → ensureAuthMiddleware.
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
	return `${toCamelCase(middlewareName)}Middleware`;
}

/**
 * Convert a name to camelCase.
 *
 * @param name - The name to convert (e.g. "send-emails")
 * @returns camelCase name (e.g. "sendEmails")
 *
 * @example
 * ```ts
 * toCamelCase("send-emails") // "sendEmails"
 * toCamelCase("event_bus") // "eventBus"
 * ```
 */
export function toCamelCase(name: string): string {
	const pascal = toPascalCase(name);
	return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}
