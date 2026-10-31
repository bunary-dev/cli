import { defineProvider } from "@bunary/core";

/**
 * {{providerName}} service provider.
 *
 * `register` binds tokens and must stay synchronous; `boot` runs after every
 * provider has registered, so it may read other bindings and may be async.
 *
 * @example
 * ```ts
 * import { {{exportName}} } from "./providers/{{providerName}}.js";
 *
 * const app = createApp({ config, providers: [{{exportName}}] });
 * ```
 */
export const {{exportName}} = defineProvider({
	name: "{{providerName}}",
	register(_app) {
		// app.set(MY_TOKEN, value);
	},
	async boot(_app) {
		// Start work that needs other providers' bindings
	},
});
