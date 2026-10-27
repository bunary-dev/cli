/**
 * route:make command - scaffold route module files
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "../../types/command.js";
import { cyan, dim, green } from "../../utils/color.js";
import {
	type DryRunOptions,
	dryRunFlags,
	dryRunOptionsFromFlags,
	reportDryRun,
} from "../../utils/dryRun.js";
import { routeNameToRegisterFunctionName } from "../../utils/naming.js";
import { routeNextSteps } from "../../utils/nextSteps.js";
import { loadStub } from "../../utils/stub.js";
import {
	assertInsideDir,
	ensureBunaryProject,
	validateMakeName,
} from "../../utils/validation.js";

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
export async function makeRoute(
	routeName: string,
	options: DryRunOptions = {},
): Promise<void> {
	const cwd = process.cwd();
	ensureBunaryProject(cwd);

	validateMakeName(routeName, "route");

	const functionName = routeNameToRegisterFunctionName(routeName);
	const routesDir = join(cwd, "src", "routes");
	const routePath = join(routesDir, `${routeName}.ts`);

	assertInsideDir(routesDir, routePath);

	if (existsSync(routePath)) {
		throw new Error(
			`Error: Route ${routeName} already exists at ${routePath}\nDelete the existing file if you want to regenerate it.`,
		);
	}

	const content = await loadStub("route/make.ts", {
		routeName,
		functionName,
	});

	if (options.dryRun) {
		reportDryRun([{ path: routePath, content }], cwd, options.verbose);
		return;
	}

	await mkdir(routesDir, { recursive: true });

	await writeFile(routePath, content, "utf-8");

	console.log(green(`✅ Created route: ${cyan(routePath)}`));
	console.log(dim(routeNextSteps(routeName, functionName)));
}

/** Command definition for the registry. */
export const command: Command = {
	name: "route:make",
	description: "Generate a route module",
	category: "scaffold",
	args: [{ name: "name", required: true, description: "Route name" }],
	flags: dryRunFlags,
	async run(args, flags) {
		await makeRoute(args[0] as string, dryRunOptionsFromFlags(flags));
	},
};
