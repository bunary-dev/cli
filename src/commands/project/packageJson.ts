/**
 * Generate package.json content for a new project.
 */
import { loadStub } from "../../utils/stub.js";

export async function generatePackageJson(name: string): Promise<string> {
	const content = await loadStub("project/packageJson.ts", { name });
	// Ensure it ends with a newline
	return content.endsWith("\n") ? content : `${content}\n`;
}
