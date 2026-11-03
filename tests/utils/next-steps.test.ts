/**
 * Next steps hint utility tests
 */
import { describe, expect, test } from "bun:test";
import {
	commandNextSteps,
	middlewareNextSteps,
	providerNextSteps,
	routeNextSteps,
} from "../../src/utils/nextSteps.js";

describe("nextSteps utilities", () => {
	describe("routeNextSteps", () => {
		test("includes import statement with .js extension", () => {
			const result = routeNextSteps("users", "registerUsers");
			expect(result).toContain('import { registerUsers } from "./users.js"');
		});

		test("includes registration call", () => {
			const result = routeNextSteps("users", "registerUsers");
			expect(result).toContain("registerUsers(router);");
		});

		test("shows target file path", () => {
			const result = routeNextSteps("users", "registerUsers");
			expect(result).toContain("src/routes/index.ts");
		});

		test("works with kebab-case route names", () => {
			const result = routeNextSteps("user-profile", "registerUserProfile");
			expect(result).toContain(
				'import { registerUserProfile } from "./user-profile.js"',
			);
			expect(result).toContain("registerUserProfile(router);");
		});

		test("includes Next: label", () => {
			const result = routeNextSteps("users", "registerUsers");
			expect(result).toContain("Next:");
		});
	});

	describe("middlewareNextSteps", () => {
		test("includes import statement with middleware path", () => {
			const result = middlewareNextSteps("ensure-auth", "ensureAuthMiddleware");
			expect(result).toContain(
				'import { ensureAuthMiddleware } from "./middleware/ensure-auth.js"',
			);
		});

		test("includes router.use() registration", () => {
			const result = middlewareNextSteps("ensure-auth", "ensureAuthMiddleware");
			expect(result).toContain("router.use(ensureAuthMiddleware);");
		});

		test("shows target file path", () => {
			const result = middlewareNextSteps("ensure-auth", "ensureAuthMiddleware");
			expect(result).toContain("src/index.ts");
		});

		test("auth middleware: boot authProvider and protect a group (#150)", () => {
			const result = middlewareNextSteps("jwt", "jwtMiddleware");
			expect(result).toContain("bun add @bunary/auth");
			expect(result).toContain(
				'import { authProvider } from "@bunary/auth/provider";',
			);
			expect(result).toContain(
				'import { authConfig, jwtMiddleware } from "./middleware/jwt.js";',
			);
			expect(result).toContain("config: { ...config, auth: authConfig },");
			expect(result).toContain(
				"providers: [authProvider, httpProvider(router)],",
			);
			expect(result).toContain("middleware: [jwtMiddleware]");
			expect(result).not.toContain("router.use(");
		});

		test("auth middleware: copy .env.example and fill in its keys (#153)", () => {
			const basic = middlewareNextSteps("basic", "basicMiddleware");
			expect(basic).toContain("cp .env.example .env");
			expect(basic).toContain(
				"fill in BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in .env",
			);
			const jwt = middlewareNextSteps("jwt", "jwtMiddleware");
			expect(jwt).toContain("cp .env.example .env");
			expect(jwt).toContain("fill in JWT_SECRET in .env");
			expect(
				middlewareNextSteps("ensure-auth", "ensureAuthMiddleware"),
			).not.toContain(".env");
		});

		test("auth middleware next steps are indented with two spaces", () => {
			for (const line of middlewareNextSteps("basic", "basicMiddleware").split(
				"\n",
			)) {
				if (line.trim()) expect(line.startsWith("  ")).toBe(true);
			}
		});
	});

	describe("commandNextSteps", () => {
		test("imports the command into config/bunary.ts", () => {
			const result = commandNextSteps("send-emails", "sendEmailsCommand");
			expect(result).toContain("config/bunary.ts");
			expect(result).toContain(
				'import { sendEmailsCommand } from "../src/commands/send-emails.js"',
			);
			expect(result).toContain("commands: [sendEmailsCommand]");
		});
	});

	describe("providerNextSteps", () => {
		test("adds the provider to createApp", () => {
			const result = providerNextSteps("cache", "cacheProvider");
			expect(result).toContain(
				'import { cacheProvider } from "./providers/cache.js"',
			);
			expect(result).toContain("providers: [cacheProvider]");
		});
	});

	describe("output format", () => {
		test("route next steps are indented with two spaces", () => {
			const result = routeNextSteps("users", "registerUsers");
			const lines = result.split("\n");
			for (const line of lines) {
				if (line.trim().length > 0) {
					expect(line.startsWith("  ")).toBe(true);
				}
			}
		});

		test("middleware next steps are indented with two spaces", () => {
			const result = middlewareNextSteps("ensure-auth", "ensureAuthMiddleware");
			const lines = result.split("\n");
			for (const line of lines) {
				if (line.trim().length > 0) {
					expect(line.startsWith("  ")).toBe(true);
				}
			}
		});
	});
});
