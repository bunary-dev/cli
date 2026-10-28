import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { promptInitOptions } from "../../src/commands/init.js";
import type { PromptInput } from "../../src/utils/prompt.js";
import { makeTempDir } from "../helpers/temp-dir.js";

class FakeInput extends EventEmitter implements PromptInput {
	isTTY = true;
	setRawMode() {
		return this;
	}
	resume() {
		return this;
	}
	pause() {
		return this;
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

/** Feed each answer once the previous prompt is waiting for input. */
function script(input: FakeInput, answers: string[]) {
	const next = () => {
		const a = answers.shift();
		if (a !== undefined)
			setTimeout(() => input.emit("data", Buffer.from(a)), 0);
	};
	input.on("newListener", (event) => {
		if (event === "data") next();
	});
}

describe("promptInitOptions", () => {
	test("asks for the name and auth type", async () => {
		const cwd = await makeTempDir("bunary-cli-");
		const input = new FakeInput();
		const output = new FakeOutput();
		script(input, ["my-api\n", "\x1b[B\x1b[B\r"]);
		const result = await promptInitOptions({}, { input, output, cwd });
		expect(result).toEqual({ name: "my-api", auth: "jwt" });
		expect(output.text).toContain("Create a new Bunary project");
		expect(output.text).toContain("Project name:");
		expect(output.text).toContain("./my-api (will be created)");
		expect(output.text).toContain("Basic Auth");
	});

	test("typing a number picks the auth type", async () => {
		const cwd = await makeTempDir("bunary-cli-");
		const input = new FakeInput();
		script(input, ["app\n", "2"]);
		const result = await promptInitOptions(
			{},
			{ input, output: new FakeOutput(), cwd },
		);
		expect(result).toEqual({ name: "app", auth: "basic" });
	});

	test("None yields no auth", async () => {
		const cwd = await makeTempDir("bunary-cli-");
		const input = new FakeInput();
		script(input, ["app\n", "\r"]);
		const result = await promptInitOptions(
			{},
			{ input, output: new FakeOutput(), cwd },
		);
		expect(result).toEqual({ name: "app", auth: undefined });
	});

	test("re-asks when the name is empty", async () => {
		const cwd = await makeTempDir("bunary-cli-");
		const input = new FakeInput();
		const output = new FakeOutput();
		script(input, ["\n", "app\n", "\r"]);
		const result = await promptInitOptions({}, { input, output, cwd });
		expect(result.name).toBe("app");
		expect(output.text).toContain("required");
	});

	test("flags given upfront become the defaults", async () => {
		const cwd = await makeTempDir("bunary-cli-");
		await mkdir(join(cwd, "existing"));
		const input = new FakeInput();
		const output = new FakeOutput();
		script(input, ["\n", "\r"]);
		const result = await promptInitOptions(
			{ name: "existing", auth: "basic" },
			{ input, output, cwd },
		);
		expect(result).toEqual({ name: "existing", auth: "basic" });
		expect(output.text).toContain("./existing (exists)");
	});

	test("'.' targets the current directory", async () => {
		const cwd = await makeTempDir("bunary-cli-");
		const input = new FakeInput();
		const output = new FakeOutput();
		script(input, [".\n", "\r"]);
		const result = await promptInitOptions({}, { input, output, cwd });
		expect(result.name).toBe(".");
		expect(output.text).toContain("current directory");
	});
});
