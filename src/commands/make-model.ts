/**
 * make:model command - scaffold ORM model files
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateModel } from "../templates/model.js";
import { tableNameToModelName } from "../utils/naming.js";
import { isBunaryProject } from "../utils/validation.js";

/**
 * Generate a model file for the ORM
 *
 * Validates that the current directory is a Bunary project,
 * then creates a model file in src/models/ directory.
 *
 * @param tableName - Database table name (e.g., "user_profile")
 * @throws Error if not in a Bunary project or file already exists
 *
 * @example
 * ```ts
 * await makeModel("user_profile");
 * // Creates src/models/UserProfile.ts
 * ```
 */
export async function makeModel(tableName: string): Promise<void> {
	const cwd = process.cwd();

	// Validate we're in a Bunary project
	if (!isBunaryProject(cwd)) {
		throw new Error(
			"Error: Not in a Bunary project.\n" +
				"Make sure you're in a directory with package.json containing @bunary/core dependency.",
		);
	}

	// Convert table name to model name
	const modelName = tableNameToModelName(tableName);
	const modelsDir = join(cwd, "src", "models");
	const modelPath = join(modelsDir, `${modelName}.ts`);

	// Check if file already exists
	if (existsSync(modelPath)) {
		throw new Error(
			`Error: Model ${modelName} already exists at ${modelPath}\nDelete the existing file if you want to regenerate it.`,
		);
	}

	// Create models directory if it doesn't exist
	await mkdir(modelsDir, { recursive: true });

	// Generate model content
	const content = generateModel(modelName, tableName);

	// Write model file
	await writeFile(modelPath, content, "utf-8");

	console.log(`✅ Created model: ${modelPath}`);
}
