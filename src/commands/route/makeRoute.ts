/**
 * make:route command - scaffold route module files
 */
import type { Command } from "../../types/command.js";
import { dim } from "../../utils/color.js";
import {
	type DryRunOptions,
	dryRunFlags,
	dryRunOptionsFromFlags,
} from "../../utils/dryRun.js";
import { generateFile } from "../../utils/generate.js";
import { routeNameToRegisterFunctionName } from "../../utils/naming.js";
import { routeNextSteps } from "../../utils/nextSteps.js";
import { loadStub } from "../../utils/stub.js";

/**
 * Generate a route module file in src/routes/.
 *
 * Validates that the current directory is a Bunary project,
 * then creates a route file in src/routes/ directory.
 *
 * @param routeName - Route name (e.g. "users", "user-profile")
 * @throws Error if not in a Bunary project, the name is invalid or the
 *   file already exists
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
	const written = await generateFile(
		{
			label: "route",
			name: routeName,
			dir: ["src", "routes"],
			render: () =>
				loadStub("route/make.ts", {
					routeName,
					functionName: routeNameToRegisterFunctionName(routeName),
				}),
		},
		options,
	);
	if (written) {
		const functionName = routeNameToRegisterFunctionName(routeName);
		console.log(dim(routeNextSteps(routeName, functionName)));
	}
}

/** Command definition for the registry. */
export const command: Command = {
	name: "make:route",
	description: "Generate a route module",
	category: "scaffold",
	args: [{ name: "name", required: true, description: "Route name" }],
	flags: dryRunFlags,
	async run(args, flags) {
		await makeRoute(args[0] as string, dryRunOptionsFromFlags(flags));
	},
};
