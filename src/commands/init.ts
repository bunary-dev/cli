/**
 * Bunary init command - scaffolds a new project
 */
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { generateConfig } from "./project/config.js";
import { generateEntrypoint } from "./project/entrypoint.js";
import { generatePackageJson } from "./project/packageJson.js";

/**
 * Initialize a new Bunary project.
 *
 * @param name - Project name or "." for current directory
 */
export async function init(name: string): Promise<void> {
	const isCurrentDir = name === ".";
	const projectDir = isCurrentDir
		? process.cwd()
		: resolve(process.cwd(), name);
	const projectName = isCurrentDir ? basename(projectDir) : name;

	// Create project directory if not current dir
	if (!isCurrentDir) {
		await mkdir(projectDir, { recursive: true });
	}

	// Create src directory
	await mkdir(join(projectDir, "src"), { recursive: true });

	// Write files
	await writeFile(
		join(projectDir, "package.json"),
		await generatePackageJson(projectName),
	);
	await writeFile(
		join(projectDir, "bunary.config.ts"),
		await generateConfig(projectName),
	);
	await writeFile(
		join(projectDir, "src", "index.ts"),
		await generateEntrypoint(),
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
export { makeModel } from "./model/makeModel.js";
