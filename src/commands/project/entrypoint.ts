/**
 * Generate src/index.ts content.
 */
import { loadStub } from "../../utils/stub.js";

export async function generateEntrypoint(): Promise<string> {
	return await loadStub("project/entrypoint.ts", {});
}
