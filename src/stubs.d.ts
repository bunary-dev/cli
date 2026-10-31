/** Stub templates are imported as text (`with { type: "text" }`). */
declare module "*.stub" {
	const content: string;
	export default content;
}
