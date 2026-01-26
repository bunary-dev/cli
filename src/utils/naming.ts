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
