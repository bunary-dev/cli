import type { BunaryApp } from "@bunary/http";

/**
 * Register {{routeName}} routes.
 *
 * @example
 * ```ts
 * import { {{functionName}} } from "./{{routeName}}.js";
 * {{functionName}}(app);
 * ```
 */
export function {{functionName}}(app: BunaryApp): void {
	app.get("/{{routeName}}", () => ({
		data: [],
	})).name("{{routeName}}.index");

	app.get<{ id: string }>("/{{routeName}}/:id", (ctx) => ({
		id: ctx.params.id,
	})).name("{{routeName}}.show").whereNumber("id");

	// More routes — see https://github.com/bunary-dev/http#routing
	// app.post("/{{routeName}}", async (ctx) => {
	//   const body = await ctx.json();
	//   return { created: true };
	// }).name("{{routeName}}.create");
	//
	// app.delete<{ id: string }>("/{{routeName}}/:id", (ctx) => {
	//   return { deleted: ctx.params.id };
	// }).name("{{routeName}}.destroy").whereNumber("id");
}
