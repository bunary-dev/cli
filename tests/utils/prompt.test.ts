import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import {
	ask,
	isInteractive,
	type PromptInput,
	parseKeys,
	select,
	selectKey,
} from "../../src/utils/prompt.js";

/** A fake TTY stdin: emit keys with `send()`. */
class FakeInput extends EventEmitter implements PromptInput {
	isTTY = true;
	raw = false;
	paused = true;
	setRawMode(mode: boolean) {
		this.raw = mode;
		return this;
	}
	resume() {
		this.paused = false;
		return this;
	}
	pause() {
		this.paused = true;
		return this;
	}
	send(...chunks: string[]) {
		for (const c of chunks) this.emit("data", Buffer.from(c));
	}
}

class FakeOutput {
	isTTY = true;
	text = "";
	write(s: string) {
		this.text += s;
		return true;
	}
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("isInteractive", () => {
	test("true when input and output are TTYs", () => {
		expect(
			isInteractive({ input: new FakeInput(), output: new FakeOutput() }),
		).toBe(true);
	});

	test("false when stdin is piped", () => {
		const input = new FakeInput();
		input.isTTY = false;
		expect(isInteractive({ input, output: new FakeOutput() })).toBe(false);
	});

	test("false when stdout is piped", () => {
		const output = new FakeOutput();
		output.isTTY = false;
		expect(isInteractive({ input: new FakeInput(), output })).toBe(false);
	});

	test("false when interactive is disabled", () => {
		expect(
			isInteractive({
				input: new FakeInput(),
				output: new FakeOutput(),
				interactive: false,
			}),
		).toBe(false);
	});
});

describe("parseKeys", () => {
	test("splits arrow escape sequences and plain characters", () => {
		expect(parseKeys("\x1b[Aj2\r\x1b[B")).toEqual([
			"\x1b[A",
			"j",
			"2",
			"\r",
			"\x1b[B",
		]);
	});
});

describe("selectKey", () => {
	test("arrow keys and j/k move with wrap-around", () => {
		expect(selectKey(0, "\x1b[B", 3)).toEqual({ index: 1 });
		expect(selectKey(2, "\x1b[B", 3)).toEqual({ index: 0 });
		expect(selectKey(0, "\x1b[A", 3)).toEqual({ index: 2 });
		expect(selectKey(1, "j", 3)).toEqual({ index: 2 });
		expect(selectKey(1, "k", 3)).toEqual({ index: 0 });
	});

	test("enter confirms the current option", () => {
		expect(selectKey(1, "\r", 3)).toEqual({ index: 1, done: true });
		expect(selectKey(1, "\n", 3)).toEqual({ index: 1, done: true });
	});

	test("a number picks that option", () => {
		expect(selectKey(0, "3", 3)).toEqual({ index: 2, done: true });
	});

	test("out-of-range numbers and other keys are ignored", () => {
		expect(selectKey(1, "4", 3)).toEqual({ index: 1 });
		expect(selectKey(1, "0", 3)).toEqual({ index: 1 });
		expect(selectKey(1, "x", 3)).toEqual({ index: 1 });
	});

	test("ctrl-c cancels", () => {
		expect(selectKey(1, "\x03", 3)).toEqual({ index: 1, cancel: true });
	});
});

describe("ask", () => {
	test("returns the typed line, trimmed", async () => {
		const input = new FakeInput();
		const output = new FakeOutput();
		const answer = ask("Project name:", { input, output });
		await tick();
		input.send("  my-api  \n");
		expect(await answer).toBe("my-api");
		expect(output.text).toContain("Project name:");
	});

	test("falls back to the default on an empty line", async () => {
		const input = new FakeInput();
		const output = new FakeOutput();
		const answer = ask("Project name:", {
			input,
			output,
			default: "my-app",
		});
		await tick();
		input.send("\n");
		expect(await answer).toBe("my-app");
		expect(output.text).toContain("my-app");
	});

	test("returns the default without prompting when not interactive", async () => {
		const input = new FakeInput();
		input.isTTY = false;
		const output = new FakeOutput();
		expect(await ask("Name:", { input, output, default: "x" })).toBe("x");
		expect(output.text).toBe("");
	});

	test("rejects when input ends", async () => {
		const input = new FakeInput();
		const answer = ask("Name:", { input, output: new FakeOutput() });
		await tick();
		input.emit("end");
		await expect(answer).rejects.toThrow(/cancelled/i);
	});
});

describe("select", () => {
	const options = ["None", "Basic Auth", "JWT"];

	test("arrow keys then enter pick an option", async () => {
		const input = new FakeInput();
		const output = new FakeOutput();
		const choice = select("Auth scaffolding:", options, { input, output });
		await tick();
		expect(input.raw).toBe(true);
		input.send("\x1b[B", "\x1b[B", "\r");
		expect(await choice).toBe(2);
		expect(input.raw).toBe(false);
		expect(input.paused).toBe(true);
		expect(output.text).toContain("❯ None");
		expect(output.text).toContain("❯ JWT");
	});

	test("typing a number picks that option", async () => {
		const input = new FakeInput();
		const choice = select("Auth:", options, {
			input,
			output: new FakeOutput(),
		});
		await tick();
		input.send("2");
		expect(await choice).toBe(1);
	});

	test("starts on the default option", async () => {
		const input = new FakeInput();
		const choice = select("Auth:", options, {
			input,
			output: new FakeOutput(),
			default: 2,
		});
		await tick();
		input.send("\r");
		expect(await choice).toBe(2);
	});

	test("returns the default without prompting when not interactive", async () => {
		const input = new FakeInput();
		input.isTTY = false;
		const output = new FakeOutput();
		expect(await select("Auth:", options, { input, output, default: 1 })).toBe(
			1,
		);
		expect(output.text).toBe("");
	});

	test("ctrl-c rejects and restores the terminal", async () => {
		const input = new FakeInput();
		const choice = select("Auth:", options, {
			input,
			output: new FakeOutput(),
		});
		await tick();
		input.send("\x03");
		await expect(choice).rejects.toThrow(/cancelled/i);
		expect(input.raw).toBe(false);
		expect(input.listenerCount("data")).toBe(0);
	});
});
