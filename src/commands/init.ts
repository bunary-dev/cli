/**
 * Bunary init command - scaffolds a new project
 */
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import type { Command } from "../types/command.js";
import { bold, cyan, dim, green } from "../utils/color.js";
import { buildFileTree } from "../utils/fileTree.js";
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

	// Create src, src/routes, config/, and (when auth) src/middleware directories
	await mkdir(join(projectDir, "config"), { recursive: true });
	await mkdir(join(projectDir, "src"), { recursive: true });
	await mkdir(join(projectDir, "src", "routes"), { recursive: true });
	if (options?.auth === "basic" || options?.auth === "jwt") {
		await mkdir(join(projectDir, "src", "middleware"), { recursive: true });
	}

	// Track created files for tree display
	const createdFiles: string[] = [];

	// Write files
	await writeFile(
		join(projectDir, "package.json"),
		await generatePackageJson(projectName, options),
	);
	createdFiles.push("package.json");

	await writeFile(
		join(projectDir, "config", "bunary.ts"),
		await generateConfig(projectName, options),
	);
	createdFiles.push("config/bunary.ts");

	await writeFile(
		join(projectDir, "src", "index.ts"),
		await generateEntrypoint(options),
	);
	createdFiles.push("src/index.ts");

	// init --auth basic|jwt is a shortcut to middleware:make basic|jwt (same content, no double-up)
	if (options?.auth === "basic" || options?.auth === "jwt") {
		await writeFile(
			join(projectDir, "src", "middleware", `${options.auth}.ts`),
			await generateMiddlewareContent(options.auth),
		);
		createdFiles.push(`src/middleware/${options.auth}.ts`);
	}
	await writeFile(
		join(projectDir, "src", "routes", "main.ts"),
		await generateRoutesMain(options),
	);
	createdFiles.push("src/routes/main.ts");

	await writeFile(
		join(projectDir, "src", "routes", "groupExample.ts"),
		await generateRoutesGroupExample(options),
	);
	createdFiles.push("src/routes/groupExample.ts");

	await writeFile(
		join(projectDir, "src", "routes", "index.ts"),
		await generateRoutesIndex(options),
	);
	createdFiles.push("src/routes/index.ts");

	console.log(
		`\n${green(`✨ Created Bunary project: ${cyan(projectName)}`)}\n`,
	);

	// Render file tree with colors
	const tree = buildFileTree(projectName, createdFiles);
	for (const line of tree.split("\n")) {
		if (line.trim()) {
			// Colorize: tree connectors dim, rest green
			const colored = line
				.replace(/([├└│─]+)/g, (match) => dim(match))
				.replace(/(\S+\/)$/g, (match) => cyan(match))
				.replace(/(?<=── )(\S+)$/g, (match) => green(match));
			console.log(`  ${colored}`);
		} else {
			console.log("");
		}
	}

	console.log("");
	console.log(bold("Next steps:"));
	if (!isCurrentDir) {
		console.log(`  ${dim("$")} ${cyan(`cd ${name}`)}`);
	}
	console.log(`  ${dim("$")} ${cyan("bun install")}`);
	console.log(`  ${dim("$")} ${cyan("bun run dev")}\n`);
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

/** Command definition for the registry. */
export const command: Command = {
	name: "init",
	description: "Create a new project",
	category: "scaffold",
	args: [
		{
			name: "name",
			required: true,
			description: "Project name or '.' for current directory",
		},
	],
	flags: [
		{
			name: "--auth",
			description: "Auth scaffolding type",
			values: ["basic", "jwt"],
		},
	],
	async run(args, flags) {
		const name = args[0];
		const authValue = flags.auth;
		let auth: "basic" | "jwt" | undefined;
		if (authValue === "basic" || authValue === "jwt") {
			auth = authValue;
		}
		await init(name, { auth });
	},
};
