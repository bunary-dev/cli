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
import {
	ask,
	isInteractive,
	type PromptOptions,
	select,
} from "../utils/prompt.js";
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
	// init --auth basic|jwt is a shortcut to make:middleware basic|jwt (same content, no double-up)
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
export {
	generateRoutesGroupExample,
	generateRoutesIndex,
	generateRoutesMain,
} from "./project/routes.js";
// Re-export generators and commands for programmatic use
export { generateConfig, generateEntrypoint, generatePackageJson };

const AUTH_CHOICES: Array<{ label: string; value: InitOptions["auth"] }> = [
	{ label: "None", value: undefined },
	{ label: "Basic Auth", value: "basic" },
	{ label: "JWT", value: "jwt" },
];

/**
 * Walk the user through `bunary init`: project name, then auth type.
 *
 * Values passed upfront as arguments or flags become the defaults.
 *
 * @param defaults - Name and auth already given on the command line
 * @param options - Prompt streams, plus `cwd` to resolve the directory
 * @throws When the user cancels (Ctrl-C / Ctrl-D)
 *
 * @example
 * ```ts
 * const { name, auth } = await promptInitOptions({});
 * await init(name, { auth });
 * ```
 */
export async function promptInitOptions(
	defaults: { name?: string; auth?: InitOptions["auth"] },
	options: PromptOptions & { cwd?: string } = {},
): Promise<{ name: string; auth: InitOptions["auth"] }> {
	const output = options.output ?? process.stdout;
	const cwd = options.cwd ?? process.cwd();
	output.write(`\n  🐇 ${bold("Create a new Bunary project")}\n\n`);

	let name = "";
	while (!name) {
		name = await ask("Project name:", { ...options, default: defaults.name });
		if (!name) output.write(`${dim("A project name is required.")}\n`);
	}

	const where =
		name === "."
			? `. ${dim("(current directory)")}`
			: `./${name} ${dim(existsSync(resolve(cwd, name)) ? "(exists)" : "(will be created)")}`;
	output.write(`Directory: ${where}\n\n`);

	const defaultAuth = AUTH_CHOICES.findIndex((c) => c.value === defaults.auth);
	const choice = await select(
		"Auth scaffolding:",
		AUTH_CHOICES.map((c) => c.label),
		{ ...options, default: Math.max(defaultAuth, 0) },
	);
	output.write("\n");
	return { name, auth: AUTH_CHOICES[choice]?.value };
}

/** Command definition for the registry. */
export const command: Command = {
	name: "init",
	description: "Create a new project",
	category: "scaffold",
	args: [
		{
			name: "name",
			// Prompted for in a terminal when omitted
			required: false,
			description: "Project name or '.' for current directory",
		},
	],
	flags: [
		{
			name: "--interactive",
			alias: "-i",
			description: "Prompt for the project name and auth type",
		},
		{
			name: "--no-interactive",
			description: "Never prompt; fail if the name is missing",
		},
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
		if (flags.interactive && flags["no-interactive"]) {
			throw new Error("--interactive cannot be combined with --no-interactive");
		}
		let name = args[0];
		const authValue = flags.auth;
		let auth: "basic" | "jwt" | undefined;
		if (authValue === "basic" || authValue === "jwt") {
			auth = authValue;
		}

		// Prompt when asked to, or when the name is missing; never without a TTY
		const canPrompt = isInteractive({
			interactive: flags["no-interactive"] !== true,
		});
		if (canPrompt && (flags.interactive === true || !name)) {
			({ name, auth } = await promptInitOptions({ name, auth }));
		}
		if (!name) {
			throw new Error(
				"Error: Project name is required\nUsage: bunary init <name> (or run it in a terminal to be prompted)",
			);
		}

		await init(name, {
			auth,
			force: flags.force === true,
			...dryRunOptionsFromFlags(flags),
		});
	},
};
