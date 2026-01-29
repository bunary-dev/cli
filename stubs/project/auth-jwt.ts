import { createAuth, createJwtGuard } from "@bunary/auth";

/**
 * JWT guard: verify Bearer tokens. Set JWT_SECRET in env (e.g. in .env).
 */
const jwtGuard = createJwtGuard({
	secret: process.env.JWT_SECRET ?? "change-me-in-production",
});

export const authMiddleware = createAuth({
	defaultGuard: "jwt",
	guards: { jwt: jwtGuard },
});
