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
