/**
 * Next steps hint utility tests
 */
import { describe, expect, test } from "bun:test";
import {
	middlewareNextSteps,
	migrationNextSteps,
	modelNextSteps,
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

	describe("modelNextSteps", () => {
		test("includes import statement with model path", () => {
			const result = modelNextSteps("users", "Users");
			expect(result).toContain('import { Users } from "./models/Users.js"');
		});

		test("shows usage example", () => {
			const result = modelNextSteps("users", "Users");
			expect(result).toContain("Users.all()");
		});

		test("works with multi-word model names", () => {
			const result = modelNextSteps("user_profile", "UserProfile");
			expect(result).toContain(
				'import { UserProfile } from "./models/UserProfile.js"',
			);
			expect(result).toContain("UserProfile.all()");
		});
	});

	describe("migrationNextSteps", () => {
		test("includes migrate command", () => {
			const result = migrationNextSteps();
			expect(result).toContain("bunary migrate");
		});

		test("includes Next: label", () => {
			const result = migrationNextSteps();
			expect(result).toContain("Next:");
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
