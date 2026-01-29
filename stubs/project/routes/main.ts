import type { BunaryApp } from "@bunary/http";

/**
 * Register base routes: / and /health
 */
export function registerMain(app: BunaryApp): void {
	app.get("/", () => ({
		message: "Welcome to Bunary!",
		docs: "https://github.com/bunary-dev",
	}));

	app.get("/health", () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	}));
}
