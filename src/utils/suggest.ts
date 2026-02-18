/**
 * Command suggestion utilities for unknown CLI commands.
 *
 * Provides Levenshtein distance calculation and "Did you mean?" suggestions
 * when users mistype a command name.
 *
 * @example
 * ```ts
 * const suggestion = suggestCommand("iinit");
 * // suggestion === "init"
 * ```
 */

import { getCommandNames } from "../registry.js";

/**
 * Calculate the Levenshtein (edit) distance between two strings.
 *
 * Uses the Wagner–Fischer dynamic programming algorithm.
 *
 * @param a - First string
 * @param b - Second string
 * @returns The minimum number of single-character edits (insertions, deletions,
 *   or substitutions) required to transform `a` into `b`
 * @example
 * ```ts
 * levenshtein("init", "iinit"); // 1
 * levenshtein("migrate", "migarte"); // 2
 * ```
 */
export function levenshtein(a: string, b: string): number {
	const m = a.length;
	const n = b.length;

	if (m === 0) return n;
	if (n === 0) return m;

	// Use a single row and update in-place for O(n) space
	const row: number[] = Array.from({ length: n + 1 }, (_, i) => i);

	for (let i = 1; i <= m; i++) {
		let prev = i - 1;
		row[0] = i;

		for (let j = 1; j <= n; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			const current = Math.min(
				row[j] + 1, // deletion
				row[j - 1] + 1, // insertion
				prev + cost, // substitution
			);
			prev = row[j];
			row[j] = current;
		}
	}

	return row[n];
}

/**
 * Suggest the closest known command for a mistyped input.
 *
 * Returns a suggestion when the input is:
 * - Within 2 edits of a known command, or
 * - A prefix of exactly one known command
 *
 * @param input - The unknown command the user typed
 * @returns The suggested command name, or `null` if nothing is close enough
 * @example
 * ```ts
 * suggestCommand("iinit");          // "init"
 * suggestCommand("ini");            // "init"
 * suggestCommand("migrate:rolback"); // "migrate:rollback"
 * suggestCommand("foobar");         // null
 * ```
 */
export function suggestCommand(input: string): string | null {
	if (input.length === 0) return null;

	const knownCommands = getCommandNames();

	// Check prefix matches first — "ini" → "init"
	const prefixMatches = knownCommands.filter((cmd) => cmd.startsWith(input));
	if (prefixMatches.length === 1) {
		return prefixMatches[0];
	}

	// Find the closest command by edit distance
	let bestMatch: string | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (const cmd of knownCommands) {
		const dist = levenshtein(input, cmd);
		if (dist < bestDistance) {
			bestDistance = dist;
			bestMatch = cmd;
		}
	}

	// Only suggest if within 2 edits
	if (bestDistance <= 2) {
		return bestMatch;
	}

	return null;
}
