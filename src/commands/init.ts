/**
 * Bunary init command - scaffolds a new project
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import type { Command } from "../types/command.js";
import { bold, cyan, dim, green } from "../utils/color.js";
import {
	dryRunFlags,
	dryRunOptionsFromFlags,
	reportDryRun,
} from "../utils/dryRun.js";
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

	// Abort before writing anything if a target file already exists
	if (!options?.force) {
		const targets = [
			"package.json",
			"config/bunary.ts",
			"src/index.ts",
			"src/routes/main.ts",
			"src/routes/groupExample.ts",
			"src/routes/index.ts",
		];
		if (options?.auth === "basic" || options?.auth === "jwt") {
			targets.push(`src/middleware/${options.auth}.ts`);
		}
		const existing = targets.filter((f) => existsSync(join(projectDir, f)));
		if (existing.length > 0) {
			throw new Error(
				`Refusing to overwrite existing files in ${projectDir}:\n${existing
					.map((f) => `  - ${f}`)
					.join("\n")}\nUse --force to overwrite.`,
			);
		}
	}

	// Plan files (relative path, content) before touching the disk
	const planned: Array<[string, string]> = [
		["package.json", await generatePackageJson(projectName, options)],
		["config/bunary.ts", await generateConfig(projectName, options)],
		["src/index.ts", await generateEntrypoint(options)],
	];
	// init --auth basic|jwt is a shortcut to middleware:make basic|jwt (same content, no double-up)
	if (options?.auth === "basic" || options?.auth === "jwt") {
		planned.push([
			`src/middleware/${options.auth}.ts`,
			await generateMiddlewareContent(options.auth),
		]);
	}
	planned.push(
		["src/routes/main.ts", await generateRoutesMain(options)],
		["src/routes/groupExample.ts", await generateRoutesGroupExample(options)],
		["src/routes/index.ts", await generateRoutesIndex(options)],
	);

	if (options?.dryRun) {
		reportDryRun(
			planned.map(([f, content]) => ({ path: join(projectDir, f), content })),
			isCurrentDir ? projectDir : dirname(projectDir),
			options.verbose,
		);
		return;
	}

	// Create project directory and parent directories of all files
	for (const dir of new Set(
		planned.map(([f]) => dirname(join(projectDir, f))),
	)) {
		await mkdir(dir, { recursive: true });
	}

	// Write files
	const createdFiles: string[] = [];
	for (const [f, content] of planned) {
		await writeFile(join(projectDir, f), content);
		createdFiles.push(f);
	}

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

export { generateMiddlewareContent } from "./middleware/makeMiddleware.js";
export { makeModel } from "./model/makeModel.js";
export {
	generateRoutesGroupExample,
	generateRoutesIndex,
	generateRoutesMain,
} from "./project/routes.js";
// Re-export generators and commands for programmatic use
export { generateConfig, generateEntrypoint, generatePackageJson };

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
		{
			name: "--force",
			description: "Overwrite existing files",
		},
		...dryRunFlags,
	],
	async run(args, flags) {
		const name = args[0] as string;
		const authValue = flags.auth;
		let auth: "basic" | "jwt" | undefined;
		if (authValue === "basic" || authValue === "jwt") {
			auth = authValue;
		}
		await init(name, {
			auth,
			force: flags.force === true,
			...dryRunOptionsFromFlags(flags),
		});
	},
};
