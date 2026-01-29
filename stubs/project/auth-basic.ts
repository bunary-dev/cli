import { createAuth, createBasicGuard } from "@bunary/auth";
import type { AuthUser } from "@bunary/auth";

/**
 * Basic Auth guard: verify username/password (e.g. against env or database).
 * Replace the verify implementation with your own logic.
 */
const basicGuard = createBasicGuard({
	async verify(username, password) {
		// Example: check against env vars. Replace with DB lookup or your logic.
		const envUser = process.env.BASIC_AUTH_USER ?? "admin";
		const envPass = process.env.BASIC_AUTH_PASSWORD ?? "changeme";
		if (username === envUser && password === envPass) {
			return { id: username, username } as AuthUser;
		}
		return null;
	},
});

export const authMiddleware = createAuth({
	defaultGuard: "basic",
	guards: { basic: basicGuard },
});
