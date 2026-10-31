import type { BunaryApp } from "{{bunaryHttp}}";

/**
 * Example route group: /api prefix with named routes.
 * Routes here are mounted at /api/...
 *
 * Groups accept an options object for middleware, name prefix, etc.:
 *   app.group({ prefix: "/api", name: "api.", middleware: [...] }, (router) => { ... })
 *
 * See https://github.com/bunary-dev/http#route-groups for more.
 */
export function registerGroupExample(app: BunaryApp): void {
	app.group({ prefix: "/api", name: "api." }, (router) => {
		router.get("/health", () => ({
			status: "ok",
			api: true,
			timestamp: new Date().toISOString(),
		})).name("health");

		// Typed params with a constraint — :id must be numeric
		router.get<{ id: string }>("/users/:id", (ctx) => ({
			id: ctx.params.id,
		})).name("users.show").whereNumber("id");
	});
}
