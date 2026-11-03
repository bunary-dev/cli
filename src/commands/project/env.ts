/**
 * Generate .env.example and .gitignore content for a new project (#151).
 */
import { loadStub } from "../../utils/stub.js";
import type { InitOptions } from "./types.js";

/**
 * `.env.example` listing the env vars the auth middleware needs, all empty.
 *
 * @param auth - Auth scaffolding type
 * @returns File content, or undefined without auth (no file is written)
 */
export async function generateEnvExample(
	auth: InitOptions["auth"],
): Promise<string | undefined> {
	if (auth !== "basic" && auth !== "jwt") return undefined;
	return await loadStub(`project/env-${auth}.ts`, {});
}

/**
 * `.gitignore` ignoring `node_modules/`, `dist/` and `.env`, never `.env.example`.
 *
 * @param existing - Current `.gitignore` content: kept as is, with the
 *   missing patterns appended
 * @returns File content
 *
 * @example
 * ```ts
 * await generateGitignore("coverage/\n"); // "coverage/\nnode_modules/\n..."
 * ```
 */
export async function generateGitignore(existing?: string): Promise<string> {
	const stub = await loadStub("project/gitignore.ts", {});
	if (existing === undefined) return stub;
	const present = new Set(existing.split(/\r?\n/).map((line) => line.trim()));
	const missing = stub
		.split("\n")
		.filter((line) => line !== "" && !present.has(line));
	if (missing.length === 0) return existing;
	const base =
		existing === "" || existing.endsWith("\n") ? existing : `${existing}\n`;
	return `${base}${missing.join("\n")}\n`;
}
