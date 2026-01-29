/**
 * Generate src/routes/ file contents.
 */
import { loadStub } from "../../utils/stub.js";

export async function generateRoutesMain(): Promise<string> {
	return await loadStub("project/routes/main.ts", {});
}

export async function generateRoutesGroupExample(): Promise<string> {
	return await loadStub("project/routes/groupExample.ts", {});
}

export async function generateRoutesIndex(): Promise<string> {
	return await loadStub("project/routes/index.ts", {});
}
