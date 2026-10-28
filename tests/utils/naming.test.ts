/**
 * Naming utilities tests
 */
import { describe, expect, it } from "bun:test";
import {
	middlewareNameToFunctionName,
	routeNameToRegisterFunctionName,
	toCamelCase,
	toPascalCase,
} from "../../src/utils/naming.js";

describe("toPascalCase", () => {
	it("should convert snake_case to PascalCase", () => {
		expect(toPascalCase("user_profile")).toBe("UserProfile");
		expect(toPascalCase("user_posts")).toBe("UserPosts");
		expect(toPascalCase("blog_comments")).toBe("BlogComments");
	});

	it("should convert single word to PascalCase", () => {
		expect(toPascalCase("user")).toBe("User");
		expect(toPascalCase("post")).toBe("Post");
		expect(toPascalCase("comment")).toBe("Comment");
	});

	it("should convert kebab-case to PascalCase", () => {
		expect(toPascalCase("user-profile")).toBe("UserProfile");
		expect(toPascalCase("blog-post")).toBe("BlogPost");
	});

	it("should handle already PascalCase", () => {
		expect(toPascalCase("UserProfile")).toBe("UserProfile");
	});

	it("should handle multiple underscores", () => {
		expect(toPascalCase("user_profile_settings")).toBe("UserProfileSettings");
	});

	it("should handle mixed case (camelCase)", () => {
		expect(toPascalCase("userProfile")).toBe("UserProfile");
	});

	it("should throw error for empty string", () => {
		expect(() => toPascalCase("")).toThrow("Name cannot be empty");
	});

	it("should handle single character", () => {
		expect(toPascalCase("u")).toBe("U");
	});
});

describe("routeNameToRegisterFunctionName", () => {
	it("should convert route name to register function name", () => {
		expect(routeNameToRegisterFunctionName("users")).toBe("registerUsers");
		expect(routeNameToRegisterFunctionName("posts")).toBe("registerPosts");
	});

	it("should handle kebab-case route names", () => {
		expect(routeNameToRegisterFunctionName("user-profile")).toBe(
			"registerUserProfile",
		);
	});

	it("should handle snake_case route names", () => {
		expect(routeNameToRegisterFunctionName("user_profile")).toBe(
			"registerUserProfile",
		);
	});

	it("should throw error for empty string", () => {
		expect(() => routeNameToRegisterFunctionName("")).toThrow(
			"Route name cannot be empty",
		);
	});
});

describe("middlewareNameToFunctionName", () => {
	it("should convert middleware name to camelCase + Middleware", () => {
		expect(middlewareNameToFunctionName("ensure-auth")).toBe(
			"ensureAuthMiddleware",
		);
		expect(middlewareNameToFunctionName("log-request")).toBe(
			"logRequestMiddleware",
		);
	});

	it("should handle single word", () => {
		expect(middlewareNameToFunctionName("logger")).toBe("loggerMiddleware");
	});

	it("should handle snake_case", () => {
		expect(middlewareNameToFunctionName("ensure_auth")).toBe(
			"ensureAuthMiddleware",
		);
	});

	it("should throw error for empty string", () => {
		expect(() => middlewareNameToFunctionName("")).toThrow(
			"Middleware name cannot be empty",
		);
	});
});

describe("toCamelCase", () => {
	it("converts kebab and snake case", () => {
		expect(toCamelCase("send-emails")).toBe("sendEmails");
		expect(toCamelCase("event_bus")).toBe("eventBus");
		expect(toCamelCase("Cache")).toBe("cache");
	});
});
