import type { BunaryApp } from "{{bunaryHttp}}";

/**
 * Register base routes: / and /health
 */
export function registerMain(app: BunaryApp): void {
	app.get("/", () => ({
		message: "Welcome to Bunary!",
		docs: "https://github.com/bunary-dev",
	})).name("home");

	app.get("/health", () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
	})).name("health");
}
