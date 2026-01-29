/**
 * Bunary init command - scaffolds a new project
 */
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { generateMiddlewareContent } from "./middleware/makeMiddleware.js";
import { generateConfig } from "./project/config.js";
import { generateEntrypoint } from "./project/entrypoint.js";
import { generatePackageJson } from "./project/packageJson.js";
import {
	generateRoutesGroupExample,
	generateRoutesIndex,
	generateRoutesMain,
} from "./project/routes.js";
import type { InitOptions } from "./project/types.js";

export type { InitOptions } from "./project/types.js";

/**
 * Initialize a new Bunary project.
 *
 * @param name - Project name or "." for current directory
 * @param options - Optional: auth "basic" or "jwt" to scaffold auth middleware
 * @example
 * ```ts
 * await init("my-api");
 * await init("my-api", { auth: "jwt" });
 * ```
 */
export async function init(name: string, options?: InitOptions): Promise<void> {
	const isCurrentDir = name === ".";
	const projectDir = isCurrentDir
		? process.cwd()
		: resolve(process.cwd(), name);
	const projectName = isCurrentDir ? basename(projectDir) : name;

	// Create project directory if not current dir
	if (!isCurrentDir) {
		await mkdir(projectDir, { recursive: true });
	}

	// Create src, src/routes, and (when auth) src/middleware directories
	await mkdir(join(projectDir, "src"), { recursive: true });
	await mkdir(join(projectDir, "src", "routes"), { recursive: true });
	if (options?.auth === "basic" || options?.auth === "jwt") {
		await mkdir(join(projectDir, "src", "middleware"), { recursive: true });
	}

	// Write files
	await writeFile(
		join(projectDir, "package.json"),
		await generatePackageJson(projectName, options),
	);
	await writeFile(
		join(projectDir, "bunary.config.ts"),
		await generateConfig(projectName, options),
	);
	await writeFile(
		join(projectDir, "src", "index.ts"),
		await generateEntrypoint(options),
	);
	// init --auth basic|jwt is a shortcut to middleware:make basic|jwt (same content, no double-up)
	if (options?.auth === "basic" || options?.auth === "jwt") {
		await writeFile(
			join(projectDir, "src", "middleware", `${options.auth}.ts`),
			await generateMiddlewareContent(options.auth),
		);
	}
	await writeFile(
		join(projectDir, "src", "routes", "main.ts"),
		await generateRoutesMain(options),
	);
	await writeFile(
		join(projectDir, "src", "routes", "groupExample.ts"),
		await generateRoutesGroupExample(options),
	);
	await writeFile(
		join(projectDir, "src", "routes", "index.ts"),
		await generateRoutesIndex(options),
	);

	console.log(`\n✨ Created Bunary project: ${projectName}\n`);
	console.log("Next steps:");
	if (!isCurrentDir) {
		console.log(`  cd ${name}`);
	}
	console.log("  bun install");
	console.log("  bun run dev\n");
}

// Re-export generators and commands for programmatic use
export { generateConfig, generateEntrypoint, generatePackageJson };
export { generateMiddlewareContent } from "./middleware/makeMiddleware.js";
export { makeModel } from "./model/makeModel.js";
export {
	generateRoutesGroupExample,
	generateRoutesIndex,
	generateRoutesMain,
} from "./project/routes.js";
