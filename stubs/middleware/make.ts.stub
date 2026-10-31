import type { Middleware } from "@bunary/http";

/**
 * {{middlewareName}} middleware.
 *
 * The Middleware type accepts a TLocals generic for typed ctx.locals:
 *   Middleware<{ user: User }>
 *
 * @example
 * ```ts
 * import { {{functionName}} } from "./middleware/{{middlewareName}}.js";
 * app.use({{functionName}});
 * ```
 */
export const {{functionName}}: Middleware = async (ctx, next) => {
	const start = performance.now();

	// Add pre-request logic here (auth checks, header injection, etc.)

	const response = await next();

	// Add post-response logic here (logging, timing headers, etc.)
	const ms = (performance.now() - start).toFixed(1);
	console.log(`${ctx.request.method} ${ctx.request.url} — ${ms}ms`);

	return response;
};
