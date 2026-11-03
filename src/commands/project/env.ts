/**
 * Generate .env.example and .gitignore content for a new project (#151) and
 * when adding auth middleware to an existing one (#153).
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

/** A `KEY=` assignment in a dotenv file (optionally `export KEY=`). */
const ENV_KEY = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;

/**
 * `.env.example` for adding auth to an existing project (`make:middleware
 * basic|jwt`, #153): the same content as {@link generateEnvExample}, merged
 * into the current file.
 *
 * @param auth - Auth middleware type
 * @param existing - Current `.env.example` content, if the file exists:
 *   kept as is, with the keys it lacks appended (empty, with the stub's
 *   comment lines). Keys already present are never repeated.
 * @returns File content, or undefined when nothing needs to change
 *
 * @example
 * ```ts
 * await extendEnvExample("jwt", "PORT=3000\n"); // "PORT=3000\n\n# HS256 ...\nJWT_SECRET=\n"
 * await extendEnvExample("jwt", "JWT_SECRET=\n"); // undefined
 * ```
 */
export async function extendEnvExample(
	auth: "basic" | "jwt",
	existing?: string,
): Promise<string | undefined> {
	const stub = (await generateEnvExample(auth)) as string;
	if (existing === undefined) return stub;
	const present = new Set(
		existing.split(/\r?\n/).flatMap((line) => line.match(ENV_KEY)?.[1] ?? []),
	);
	const lines = stub.split("\n").filter((line) => line !== "");
	const missing = lines.filter((line) => {
		const key = line.match(ENV_KEY)?.[1];
		return key !== undefined && !present.has(key);
	});
	if (missing.length === 0) return undefined;
	const comments = lines.filter((line) => line.startsWith("#"));
	const base =
		existing === ""
			? ""
			: existing.endsWith("\n")
				? `${existing}\n`
				: `${existing}\n\n`;
	return `${base}${[...comments, ...missing].join("\n")}\n`;
}
