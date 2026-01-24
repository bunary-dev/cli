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
