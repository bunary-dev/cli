/**
 * Stub templates, embedded in the bundle as text so `init` and `make:*` work
 * from `dist/` and from a `bun build --compile` binary alike (#125).
 * Adding a stub: drop `stubs/<path>.ts.stub` and add it here; the
 * "every stub file on disk is embedded" test fails until you do.
 */
import commandMake from "../../stubs/command/make.ts.stub" with {
	type: "text",
};
import middlewareAuthBasic from "../../stubs/middleware/auth-basic.ts.stub" with {
	type: "text",
};
import middlewareAuthJwt from "../../stubs/middleware/auth-jwt.ts.stub" with {
	type: "text",
};
import middlewareMake from "../../stubs/middleware/make.ts.stub" with {
	type: "text",
};
import projectConfig from "../../stubs/project/config.ts.stub" with {
	type: "text",
};
import projectEntrypoint from "../../stubs/project/entrypoint.ts.stub" with {
	type: "text",
};
import projectPackageJson from "../../stubs/project/packageJson.ts.stub" with {
	type: "text",
};
import projectRoutesGroupExample from "../../stubs/project/routes/groupExample.ts.stub" with {
	type: "text",
};
import projectRoutesIndex from "../../stubs/project/routes/index.ts.stub" with {
	type: "text",
};
import projectRoutesMain from "../../stubs/project/routes/main.ts.stub" with {
	type: "text",
};
import providerMake from "../../stubs/provider/make.ts.stub" with {
	type: "text",
};
import routeMake from "../../stubs/route/make.ts.stub" with { type: "text" };

export const STUBS: Readonly<Record<string, string>> = {
	"command/make.ts": commandMake,
	"middleware/auth-basic.ts": middlewareAuthBasic,
	"middleware/auth-jwt.ts": middlewareAuthJwt,
	"middleware/make.ts": middlewareMake,
	"project/config.ts": projectConfig,
	"project/entrypoint.ts": projectEntrypoint,
	"project/packageJson.ts": projectPackageJson,
	"project/routes/groupExample.ts": projectRoutesGroupExample,
	"project/routes/index.ts": projectRoutesIndex,
	"project/routes/main.ts": projectRoutesMain,
	"provider/make.ts": providerMake,
	"route/make.ts": routeMake,
};
