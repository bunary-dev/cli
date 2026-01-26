/**
 * Generate bunary.config.ts content.
 */
import { loadStub } from "../../utils/stub.js";

export async function generateConfig(name: string): Promise<string> {
	return await loadStub("project/config.ts", { name });
}
