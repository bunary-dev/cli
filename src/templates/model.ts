/**
 * Generate model file content from template
 */

/**
 * Generate a model class file content
 *
 * @param modelName - PascalCase model name (e.g., "UserProfile")
 * @param tableName - Database table name (e.g., "user_profile")
 * @returns Model file content as string
 *
 * @example
 * ```ts
 * const content = generateModel("UserProfile", "user_profile");
 * // Returns TypeScript model class extending BaseModel
 * ```
 */
export function generateModel(modelName: string, tableName: string): string {
	return `/**
 * ${modelName} Model
 *
 * Represents the ${tableName} table in the database.
 * Use this model to query data.
 *
 * @example
 * \`\`\`ts
 * import { ${modelName} } from "../models/${modelName}.js";
 *
 * // Get all records
 * const records = await ${modelName}.all();
 *
 * // Find a record by ID
 * const record = await ${modelName}.find(1);
 *
 * // Query with conditions
 * const results = await ${modelName}.where("field", "value").all();
 * \`\`\`
 */

import { BaseModel } from "@bunary/orm";

export class ${modelName} extends BaseModel {
	protected static tableName = "${tableName}";
	// Protected fields: automatically excluded from all query results
	// protected static protected = ["password", "secret_key"];
	// Timestamps: automatically excluded from all query results
	// protected static timestamps = true;
}
`;
}
