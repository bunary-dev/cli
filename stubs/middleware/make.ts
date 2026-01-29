import type { Middleware } from "@bunary/http";

/**
 * {{middlewareName}} middleware.
 * Add logic before/after calling next().
 */
export const {{functionName}}: Middleware = async (ctx, next) => {
	// Add logic before the request (e.g. logging, auth check)
	const response = await next();
	// Add logic after the response (e.g. logging)
	return response;
};
