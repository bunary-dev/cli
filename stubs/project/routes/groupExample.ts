import type { BunaryApp } from "@bunary/http";

/**
 * Example route group: /api prefix.
 * Routes here are mounted at /api/...
 */
export function registerGroupExample(app: BunaryApp): void {
	app.group("/api", (router) => {
		router.get("/health", () => ({
			status: "ok",
			api: true,
			timestamp: new Date().toISOString(),
		}));
	});
}
