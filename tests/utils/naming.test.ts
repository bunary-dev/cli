/**
 * Naming utilities tests
 */
import { describe, expect, it } from "bun:test";
import { tableNameToModelName } from "../../src/utils/naming.js";

describe("tableNameToModelName", () => {
	it("should convert snake_case to PascalCase", () => {
		expect(tableNameToModelName("user_profile")).toBe("UserProfile");
		expect(tableNameToModelName("user_posts")).toBe("UserPosts");
		expect(tableNameToModelName("blog_comments")).toBe("BlogComments");
	});

	it("should convert single word to PascalCase", () => {
		expect(tableNameToModelName("user")).toBe("User");
		expect(tableNameToModelName("post")).toBe("Post");
		expect(tableNameToModelName("comment")).toBe("Comment");
	});

	it("should convert kebab-case to PascalCase", () => {
		expect(tableNameToModelName("user-profile")).toBe("UserProfile");
		expect(tableNameToModelName("blog-post")).toBe("BlogPost");
	});

	it("should handle already PascalCase", () => {
		expect(tableNameToModelName("UserProfile")).toBe("UserProfile");
	});

	it("should handle multiple underscores", () => {
		expect(tableNameToModelName("user_profile_settings")).toBe(
			"UserProfileSettings",
		);
	});

	it("should handle mixed case (camelCase)", () => {
		expect(tableNameToModelName("userProfile")).toBe("UserProfile");
	});

	it("should throw error for empty string", () => {
		expect(() => tableNameToModelName("")).toThrow(
			"Table name cannot be empty",
		);
	});

	it("should handle single character", () => {
		expect(tableNameToModelName("u")).toBe("U");
	});
});
