import { createAuth, createJwtGuard } from "@bunary/auth";

/**
 * JWT guard: verify Bearer tokens. Requires JWT_SECRET in env (e.g. in .env).
 */
const secret = process.env.JWT_SECRET;
if (!secret || secret.trim() === "") {
	throw new Error(
		"JWT_SECRET is required. Set it in your environment (e.g. in .env).",
	);
}
const jwtGuard = createJwtGuard({ secret });

export const {{functionName}} = createAuth({
	defaultGuard: "jwt",
	guards: { jwt: jwtGuard },
});
