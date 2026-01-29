/**
 * route:make command - scaffold route module files
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { routeNameToRegisterFunctionName } from "../../utils/naming.js";
import { loadStub } from "../../utils/stub.js";
import { isBunaryProject } from "../../utils/validation.js";

/**
 * Generate a route module file in src/routes/.
 *
 * Validates that the current directory is a Bunary project,
 * then creates a route file in src/routes/ directory.
 *
 * @param routeName - Route name (e.g. "users", "user-profile")
 * @throws Error if not in a Bunary project or file already exists
 *
 * @example
 * ```ts
 * await makeRoute("users");
 * // Creates src/routes/users.ts with registerUsers(app)
 * ```
 */
export async function makeRoute(routeName: string): Promise<void> {
	const cwd = process.cwd();

	if (!isBunaryProject(cwd)) {
		throw new Error(
			"Error: Not in a Bunary project.\n" +
				"Make sure you're in a directory with package.json containing @bunary/core dependency.",
		);
	}

	const functionName = routeNameToRegisterFunctionName(routeName);
	const routesDir = join(cwd, "src", "routes");
	const routePath = join(routesDir, `${routeName}.ts`);

	if (existsSync(routePath)) {
		throw new Error(
			`Error: Route file ${routePath} already exists.\nDelete the existing file if you want to regenerate it.`,
		);
	}

	await mkdir(routesDir, { recursive: true });

	const content = await loadStub("route/make.ts", {
		routeName,
		functionName,
	});

	await writeFile(routePath, content, "utf-8");

	console.log(`✅ Created route: ${routePath}`);
}
