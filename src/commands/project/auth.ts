/**
 * Generate src/auth.ts content for Basic or JWT auth scaffolding.
 */
import { loadStub } from "../../utils/stub.js";

export type AuthGuard = "basic" | "jwt";

/**
 * Generate auth middleware setup for init --auth (basic|jwt).
 *
 * @param guard - "basic" or "jwt"
 * @returns File content for src/auth.ts
 * @example
 * ```ts
 * const content = await generateAuth("jwt");
 * await writeFile(join(projectDir, "src", "auth.ts"), content);
 * ```
 */
export async function generateAuth(guard: AuthGuard): Promise<string> {
	const stubPath =
		guard === "basic" ? "project/auth-basic.ts" : "project/auth-jwt.ts";
	return await loadStub(stubPath, {});
}
