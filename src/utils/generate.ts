/**
 * Shared write path for the `make:*` generators.
 *
 * Every generator goes through {@link generateFile}, so the safety rules live
 * in one place: the project check, the name check, confinement to the
 * project root (symlinks included) and the no-overwrite rule.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cyan, green } from "./color.js";
import {
	type DryRunOptions,
	type PlannedFile,
	reportDryRun,
} from "./dryRun.js";
import {
	assertInsideProject,
	ensureBunaryProject,
	validateMakeName,
} from "./validation.js";

/** What a generator wants written. */
export interface GeneratedFile {
	/** Human-readable kind, used in messages (e.g. "route") */
	label: string;
	/** User-supplied name; becomes the file name `<name>.ts` */
	name: string;
	/** Directory relative to the project root (e.g. ["src", "routes"]) */
	dir: string[];
	/** Produces the file content once the target is known to be safe */
	render: () => Promise<string>;
	/**
	 * Other project files to create or update alongside it (e.g.
	 * `.env.example` for the auth middleware, #153), planned once the target
	 * is known to be safe (absolute paths, inside the project). Written
	 * (replacing any current content) after the main file, or listed on a
	 * dry run.
	 */
	companions?: (cwd: string) => Promise<PlannedFile[]>;
}

/**
 * Validate, then write (or with `dryRun`, report) one generated file under
 * the current project.
 *
 * @param file - The file to generate
 * @param options - Dry-run options
 * @returns The absolute path written, or `undefined` on a dry run
 * @throws When not in a Bunary project, the name is invalid, the path
 *   escapes the project root, or the file already exists
 *
 * @example
 * ```ts
 * await generateFile({
 *   label: "route",
 *   name: "users",
 *   dir: ["src", "routes"],
 *   render: () => loadStub("route/make.ts", { routeName: "users" }),
 * });
 * ```
 */
export async function generateFile(
	file: GeneratedFile,
	options: DryRunOptions = {},
): Promise<string | undefined> {
	const cwd = process.cwd();
	ensureBunaryProject(cwd);
	validateMakeName(file.name, file.label);

	const path = join(cwd, ...file.dir, `${file.name}.ts`);
	assertInsideProject(cwd, path);

	if (existsSync(path)) {
		const kind = file.label.charAt(0).toUpperCase() + file.label.slice(1);
		throw new Error(
			`Error: ${kind} ${file.name} already exists at ${path}\nDelete the existing file if you want to regenerate it.`,
		);
	}

	const content = await file.render();
	const companions = (await file.companions?.(cwd)) ?? [];
	for (const companion of companions) assertInsideProject(cwd, companion.path);

	if (options.dryRun) {
		reportDryRun([{ path, content }, ...companions], cwd, options.verbose);
		return undefined;
	}

	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, content, { encoding: "utf-8", flag: "wx" });

	console.log(green(`✅ Created ${file.label}: ${cyan(path)}`));

	for (const companion of companions) {
		await writeFile(companion.path, companion.content, "utf-8");
		const verb = companion.update ? "Updated" : "Created";
		console.log(green(`✅ ${verb} ${cyan(companion.path)}`));
	}
	return path;
}
