/**
 * Zero-dependency terminal prompts: text input and an arrow-key selector.
 *
 * Both prompts only run when stdin and stdout are TTYs. In CI, with piped
 * stdin or with `interactive: false` (e.g. `--no-interactive`) they return
 * their default without printing anything.
 *
 * @example
 * ```ts
 * import { ask, select } from "../utils/prompt.js";
 *
 * const name = await ask("Project name:");
 * const auth = await select("Auth scaffolding:", ["None", "Basic Auth", "JWT"]);
 * ```
 */

import { cyan, dim } from "./color.js";

/** The parts of `process.stdin` the prompts use. */
export interface PromptInput {
	isTTY?: boolean;
	setRawMode?(mode: boolean): unknown;
	on(
		event: "data" | "end",
		listener: (chunk: Buffer | string) => void,
	): unknown;
	off(
		event: "data" | "end",
		listener: (chunk: Buffer | string) => void,
	): unknown;
	resume(): unknown;
	pause(): unknown;
}

/** The parts of `process.stdout` the prompts use. */
export interface PromptOutput {
	isTTY?: boolean;
	write(s: string): unknown;
}

/** Options shared by {@link ask} and {@link select}. */
export interface PromptOptions {
	/** Defaults to `process.stdin`. */
	input?: PromptInput;
	/** Defaults to `process.stdout`. */
	output?: PromptOutput;
	/** `false` never prompts (e.g. `--no-interactive`). */
	interactive?: boolean;
}

const UP = "\x1b[A";
const DOWN = "\x1b[B";
const CTRL_C = "\x03";
// One escape sequence (arrow keys) or one character
// biome-ignore lint/suspicious/noControlCharactersInRegex: matches ESC of arrow keys
const KEY = /\x1b\[[A-Z]|[\s\S]/g;

/**
 * Whether prompts can run: both streams are TTYs and prompting isn't disabled.
 *
 * @example
 * ```ts
 * if (!isInteractive()) throw new Error("Project name is required");
 * ```
 */
export function isInteractive(options: PromptOptions = {}): boolean {
	const input = options.input ?? process.stdin;
	const output = options.output ?? process.stdout;
	return (
		options.interactive !== false &&
		input.isTTY === true &&
		output.isTTY === true
	);
}

/**
 * Ask for a line of text. An empty answer yields `default` (or "").
 *
 * Reading from the real stdin uses Bun's built-in `prompt()`.
 *
 * @throws When input ends before an answer (Ctrl-D)
 *
 * @example
 * ```ts
 * const name = await ask("Project name:", { default: "my-app" });
 * ```
 */
export async function ask(
	question: string,
	options: PromptOptions & { default?: string } = {},
): Promise<string> {
	const fallback = options.default ?? "";
	if (!isInteractive(options)) return fallback;

	const label = options.default
		? `${question} ${dim(`(${options.default})`)}`
		: question;
	let line: string | null;
	if (options.input) {
		(options.output ?? process.stdout).write(`${label} `);
		line = await readLine(options.input);
	} else {
		line = prompt(label);
	}
	if (line === null) throw new Error("Cancelled");
	return line.trim() || fallback;
}

/** Resolve with the next line from `input`, or `null` when it ends. */
function readLine(input: PromptInput): Promise<string | null> {
	return new Promise((resolve) => {
		let buffered = "";
		const finish = (line: string | null) => {
			input.off("data", onData);
			input.off("end", onEnd);
			input.pause();
			resolve(line);
		};
		const onData = (chunk: Buffer | string) => {
			buffered += chunk.toString();
			const nl = buffered.search(/\r?\n/);
			if (nl !== -1) finish(buffered.slice(0, nl));
		};
		const onEnd = () => finish(null);
		input.on("data", onData);
		input.on("end", onEnd);
		input.resume();
	});
}

/**
 * Split a raw-mode stdin chunk into keys (escape sequences stay whole).
 *
 * @example
 * ```ts
 * parseKeys("\x1b[Bj\r"); // ["\x1b[B", "j", "\r"]
 * ```
 */
export function parseKeys(chunk: string): string[] {
	return chunk.match(KEY) ?? [];
}

/** Next state of a selector after one key press. */
export interface SelectState {
	index: number;
	done?: true;
	cancel?: true;
}

/**
 * Apply one key press to a selector with `count` options.
 *
 * Up/Down (or k/j) move with wrap-around, Enter confirms, a digit picks that
 * option, Ctrl-C cancels; anything else is ignored.
 *
 * @example
 * ```ts
 * selectKey(0, "\x1b[B", 3); // { index: 1 }
 * selectKey(0, "3", 3);      // { index: 2, done: true }
 * ```
 */
export function selectKey(
	index: number,
	key: string,
	count: number,
): SelectState {
	if (key === UP || key === "k") return { index: (index - 1 + count) % count };
	if (key === DOWN || key === "j") return { index: (index + 1) % count };
	if (key === "\r" || key === "\n") return { index, done: true };
	if (key === CTRL_C) return { index, cancel: true };
	if (/^[1-9]$/.test(key) && Number(key) <= count) {
		return { index: Number(key) - 1, done: true };
	}
	return { index };
}

/**
 * Let the user pick one of `choices` with the arrow keys or by number.
 *
 * @returns The index of the chosen option (`default`, or 0, when not interactive)
 * @throws When the user presses Ctrl-C
 *
 * @example
 * ```ts
 * const i = await select("Auth scaffolding:", ["None", "Basic Auth", "JWT"]);
 * ```
 */
export async function select(
	question: string,
	choices: string[],
	options: PromptOptions & { default?: number } = {},
): Promise<number> {
	let index = options.default ?? 0;
	if (!isInteractive(options)) return index;

	const input = options.input ?? process.stdin;
	const output = options.output ?? process.stdout;

	const render = () =>
		choices
			.map((c, i) =>
				i === index ? `  ${cyan(`❯ ${c}`)}\n` : `    ${c} ${dim(`${i + 1}`)}\n`,
			)
			.join("");

	output.write(`${question} ${dim("(↑/↓ or number, Enter)")}\n${render()}`);

	return new Promise((resolve, reject) => {
		const finish = (cancelled: boolean) => {
			input.off("data", onData);
			input.setRawMode?.(false);
			input.pause();
			// Collapse the list into the chosen answer
			output.write(`\x1b[${choices.length + 1}A\x1b[J`);
			if (cancelled) {
				output.write(`${question}\n`);
				reject(new Error("Cancelled"));
			} else {
				output.write(`${question} ${cyan(choices[index] as string)}\n`);
				resolve(index);
			}
		};
		const onData = (chunk: Buffer | string) => {
			for (const key of parseKeys(chunk.toString())) {
				const next = selectKey(index, key, choices.length);
				index = next.index;
				if (next.cancel || next.done) return finish(next.cancel === true);
			}
			output.write(`\x1b[${choices.length}A\x1b[J${render()}`);
		};
		input.setRawMode?.(true);
		input.on("data", onData);
		input.resume();
	});
}
