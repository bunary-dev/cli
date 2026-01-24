/**
 * Bunary init command - scaffolds a new project
 */
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

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
		generatePackageJson(projectName),
	);
	await writeFile(
		join(projectDir, "bunary.config.ts"),
		generateConfig(projectName),
	);
	await writeFile(join(projectDir, "src", "index.ts"), generateEntrypoint());

	console.log(`\n✨ Created Bunary project: ${projectName}\n`);
	console.log("Next steps:");
	if (!isCurrentDir) {
		console.log(`  cd ${name}`);
	}
	console.log("  bun install");
	console.log("  bun run dev\n");
}

/**
 * Generate package.json content for a new project.
 */
export function generatePackageJson(name: string): string {
	const pkg = {
		name,
		version: "0.0.1",
		type: "module",
		scripts: {
			dev: "bun run --hot src/index.ts",
			start: "bun run src/index.ts",
			build: "bun build ./src/index.ts --outdir ./dist --target bun",
		},
		dependencies: {
			"@bunary/core": "^0.0.2",
			"@bunary/http": "^0.0.2",
		},
		devDependencies: {
			"@types/bun": "latest",
			typescript: "^5.7.3",
		},
	};

	return `${JSON.stringify(pkg, null, 2)}\n`;
}

/**
 * Generate bunary.config.ts content.
 */
export function generateConfig(name: string): string {
	return `import { defineConfig } from "@bunary/core";

export default defineConfig({
  app: {
    name: "${name}",
    env: "development",
    debug: true,
  },
});
`;
}

/**
 * Generate src/index.ts content.
 */
export function generateEntrypoint(): string {
	return `import { createApp } from "@bunary/http";

const app = createApp();

app.get("/", () => ({
  message: "Welcome to Bunary!",
  docs: "https://github.com/bunary-dev",
}));

app.get("/health", () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

const server = app.listen(3000);
console.log(\`🚀 Server running at http://localhost:\${server.port}\`);
`;
}
