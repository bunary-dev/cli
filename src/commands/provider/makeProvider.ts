/**
 * make:provider command - scaffold a service provider
 */
import type { Command } from "../../types/command.js";
import { dim } from "../../utils/color.js";
import {
	type DryRunOptions,
	dryRunFlags,
	dryRunOptionsFromFlags,
} from "../../utils/dryRun.js";
import { generateFile } from "../../utils/generate.js";
import { toCamelCase } from "../../utils/naming.js";
import { providerNextSteps } from "../../utils/nextSteps.js";
import { loadStub } from "../../utils/stub.js";

/**
 * Generate a service provider in src/providers/ using `defineProvider`
 * from `@bunary/core`.
 *
 * @param providerName - Provider name (e.g. "cache", "event-bus")
 * @throws Error if not in a Bunary project, the name is invalid or the
 *   file already exists
 *
 * @example
 * ```ts
 * await makeProvider("cache");
 * // Creates src/providers/cache.ts exporting cacheProvider
 * ```
 */
export async function makeProvider(
	providerName: string,
	options: DryRunOptions = {},
): Promise<void> {
	const written = await generateFile(
		{
			label: "provider",
			name: providerName,
			dir: ["src", "providers"],
			render: () =>
				loadStub("provider/make.ts", {
					providerName,
					exportName: `${toCamelCase(providerName)}Provider`,
				}),
		},
		options,
	);
	if (written) {
		console.log(
			dim(
				providerNextSteps(providerName, `${toCamelCase(providerName)}Provider`),
			),
		);
	}
}

/** Command definition for the registry. */
export const command: Command = {
	name: "make:provider",
	description: "Generate a service provider",
	category: "scaffold",
	args: [{ name: "name", required: true, description: "Provider name" }],
	flags: dryRunFlags,
	async run(args, flags) {
		await makeProvider(args[0] as string, dryRunOptionsFromFlags(flags));
	},
};
