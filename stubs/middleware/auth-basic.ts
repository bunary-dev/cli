import { createAuth, createBasicGuard } from "@bunary/auth";
import type { AuthUser } from "@bunary/auth";

/**
 * Basic Auth guard: verify username/password against env (or replace with DB lookup).
 * Requires BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in env (e.g. in .env).
 */
const envUser = process.env.BASIC_AUTH_USER;
const envPass = process.env.BASIC_AUTH_PASSWORD;
if (!envUser?.trim() || !envPass?.trim()) {
	throw new Error(
		"BASIC_AUTH_USER and BASIC_AUTH_PASSWORD are required. Set them in your environment (e.g. in .env).",
	);
}
const basicGuard = createBasicGuard({
	async verify(username, password) {
		if (username === envUser && password === envPass) {
			return { id: username, username } as AuthUser;
		}
		return null;
	},
});

export const {{functionName}} = createAuth({
	defaultGuard: "basic",
	guards: { basic: basicGuard },
});
