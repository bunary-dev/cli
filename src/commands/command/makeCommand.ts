/**
 * make:command command - scaffold an app command for `bunary <name>`
 */
import type { Command } from "../../types/command.js";
import { dim } from "../../utils/color.js";
import {
	type DryRunOptions,
	dryRunFlags,
	dryRunOptionsFromFlags,
} from "../../utils/dryRun.js";
import { generateFile } from "../../utils/generate.js";
import { toCamelCase } from "../../utils/naming.js";
import { commandNextSteps } from "../../utils/nextSteps.js";
import { loadStub } from "../../utils/stub.js";

/** Options for {@link makeCommand}. */
export interface MakeCommandOptions extends DryRunOptions {
	/** CLI name of the command (e.g. "mail:send"); defaults to the file name */
	commandName?: string;
}

/** Colon-separated segments, each a letter followed by letters, digits or `-`. */
const COMMAND_NAME_RE = /^[A-Za-z][A-Za-z0-9-]*(:[A-Za-z][A-Za-z0-9-]*)*$/;

/**
 * Generate an app command in src/commands/, typed with the `Command`
 * contract from `@bunary/core`.
 *
 * @param fileName - File name and default command name (e.g. "send-emails")
 * @param options - `commandName` to set the CLI name, plus dry-run options
 * @throws Error if not in a Bunary project, a name is invalid or the file
 *   already exists
 *
 * @example
 * ```ts
 * await makeCommand("send-emails", { commandName: "mail:send" });
 * // Creates src/commands/send-emails.ts exporting sendEmailsCommand
 * ```
 */
export async function makeCommand(
	fileName: string,
	options: MakeCommandOptions = {},
): Promise<void> {
	const commandName = options.commandName ?? fileName;
	if (!COMMAND_NAME_RE.test(commandName ?? "")) {
		throw new Error(
			`Error: Invalid command name "${commandName}".\n` +
				"Use letters, digits and hyphens, optionally in colon-separated segments (e.g. mail:send).",
		);
	}

	const written = await generateFile(
		{
			label: "command",
			name: fileName,
			dir: ["src", "commands"],
			render: () =>
				loadStub("command/make.ts", {
					commandName,
					fileName,
					exportName: `${toCamelCase(fileName)}Command`,
				}),
		},
		options,
	);
	if (written) {
		console.log(
			dim(commandNextSteps(fileName, `${toCamelCase(fileName)}Command`)),
		);
	}
}

/** Command definition for the registry. */
export const command: Command = {
	name: "make:command",
	description: "Generate an app command",
	category: "scaffold",
	args: [{ name: "name", required: true, description: "Command file name" }],
	flags: [
		{
			name: "--name",
			description: "CLI name, e.g. mail:send (defaults to the file name)",
			takesValue: true,
		},
		...dryRunFlags,
	],
	async run(args, flags) {
		await makeCommand(args[0] as string, {
			commandName: typeof flags.name === "string" ? flags.name : undefined,
			...dryRunOptionsFromFlags(flags),
		});
	},
};
