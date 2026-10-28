import type { Command } from "@bunary/core";

/**
 * `bunary {{commandName}}`
 *
 * @example
 * ```ts
 * // config/bunary.ts
 * import { {{exportName}} } from "../src/commands/{{fileName}}.js";
 *
 * export default defineConfig({
 *   app: { name: "my-app" },
 *   commands: [{{exportName}}],
 * });
 * ```
 */
export const {{exportName}}: Command = {
	name: "{{commandName}}",
	description: "Describe what {{commandName}} does",
	usage: "bunary {{commandName}}",
	category: "project",
	// args: [{ name: "name", required: true, description: "..." }],
	// flags: [{ name: "force", alias: "f", description: "..." }],
	async run(args, flags) {
		console.log("{{commandName}}", args, flags);
	},
};
