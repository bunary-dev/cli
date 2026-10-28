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
			expect(result).toContain("registerUsers(app);");
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
			expect(result).toContain("registerUserProfile(app);");
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

		test("includes app.use() registration", () => {
			const result = middlewareNextSteps("ensure-auth", "ensureAuthMiddleware");
			expect(result).toContain("app.use(ensureAuthMiddleware);");
		});

		test("shows target file path", () => {
			const result = middlewareNextSteps("ensure-auth", "ensureAuthMiddleware");
			expect(result).toContain("src/index.ts");
		});

		test("works with auth middleware names", () => {
			const result = middlewareNextSteps("jwt", "jwtMiddleware");
			expect(result).toContain(
				'import { jwtMiddleware } from "./middleware/jwt.js"',
			);
			expect(result).toContain("app.use(jwtMiddleware);");
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
