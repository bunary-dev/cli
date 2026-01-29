/**
 * {{modelName}} Model
 *
 * Represents the {{tableName}} table in the database.
 * Use this model to query data.
 *
 * @example
 * ```ts
 * import { {{modelName}} } from "./models/{{modelName}}.js";
 *
 * // Get all records
 * const records = await {{modelName}}.all();
 *
 * // Find a record by ID
 * const record = await {{modelName}}.find(1);
 *
 * // Query with conditions
 * const results = await {{modelName}}.where("field", "value").all();
 * ```
 */

import { BaseModel } from "@bunary/orm";

export class {{modelName}} extends BaseModel {
	protected static tableName = "{{tableName}}";
	// Protected fields: automatically excluded from all query results
	// protected static protected = ["password", "secret_key"];
	// Timestamps: automatically excluded from all query results
	// protected static timestamps = true;
}
