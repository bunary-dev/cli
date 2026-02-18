/**
 * Build an ASCII file tree string from a list of relative file paths.
 *
 * Used to display what files were created after scaffolding commands.
 * Returns a plain string (no ANSI colors) — callers can wrap with
 * color helpers if needed.
 *
 * @param rootName - The root directory name shown at the top of the tree
 * @param files - Relative file paths (e.g. `["package.json", "src/index.ts"]`)
 * @returns A multi-line string showing the ASCII tree with a file count
 *
 * @example
 * ```ts
 * const tree = buildFileTree("my-app", [
 *   "package.json",
 *   "config/bunary.ts",
 *   "src/index.ts",
 *   "src/routes/main.ts",
 * ]);
 * console.log(tree);
 * // my-app/
 * // ├── config/
 * // │   └── bunary.ts
 * // ├── src/
 * // │   ├── routes/
 * // │   │   └── main.ts
 * // │   └── index.ts
 * // └── package.json
 * //
 * // 4 files created
 * ```
 */
export function buildFileTree(rootName: string, files: string[]): string {
	const tree = buildTreeStructure(files);
	const lines: string[] = [];

	lines.push(`${rootName}/`);
	renderNode(tree, "", lines);

	const count = files.length;
	const label = count === 1 ? "file" : "files";
	lines.push("");
	lines.push(`${count} ${label} created`);

	return lines.join("\n");
}

/** Internal node representing a directory in the tree. */
interface TreeNode {
	/** Child directories, sorted alphabetically. */
	dirs: Map<string, TreeNode>;
	/** Files in this directory, in insertion order. */
	files: string[];
}

/**
 * Parse flat file paths into a nested tree structure.
 *
 * @param files - Relative file paths
 * @returns Root tree node
 */
function buildTreeStructure(files: string[]): TreeNode {
	const root: TreeNode = { dirs: new Map(), files: [] };

	for (const filePath of files) {
		const parts = filePath.split("/");
		let current = root;

		// Walk/create directories for all segments except the last (the file name)
		for (let i = 0; i < parts.length - 1; i++) {
			const dirName = parts[i];
			if (!current.dirs.has(dirName)) {
				current.dirs.set(dirName, { dirs: new Map(), files: [] });
			}
			current = current.dirs.get(dirName) as TreeNode;
		}

		// Last segment is the file name
		current.files.push(parts[parts.length - 1]);
	}

	return root;
}

/**
 * Recursively render a tree node into lines with ASCII box-drawing prefixes.
 *
 * @param node - Current tree node to render
 * @param prefix - Current indentation prefix for child lines
 * @param lines - Accumulator for output lines
 */
function renderNode(node: TreeNode, prefix: string, lines: string[]): void {
	// Collect entries: directories first (sorted), then files (in order)
	const dirNames = [...node.dirs.keys()].sort();
	const entries: Array<{ name: string; isDir: boolean }> = [];

	for (const name of dirNames) {
		entries.push({ name, isDir: true });
	}
	for (const name of node.files) {
		entries.push({ name, isDir: false });
	}

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		const isLast = i === entries.length - 1;
		const connector = isLast ? "└── " : "├── ";
		const childPrefix = isLast ? "    " : "│   ";

		if (entry.isDir) {
			lines.push(`${prefix}${connector}${entry.name}/`);
			const childNode = node.dirs.get(entry.name) as TreeNode;
			renderNode(childNode, `${prefix}${childPrefix}`, lines);
		} else {
			lines.push(`${prefix}${connector}${entry.name}`);
		}
	}
}
