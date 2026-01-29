import { createApp } from "{{bunaryHttp}}";
import { registerRoutes } from "./routes/index.js";
{{authImport}}
// If supported by your @bunary/http version, you can pass { basePath: "/api" } to prefix all routes:
// const app = createApp({ basePath: "/api" });
const app = createApp();
registerRoutes(app);
{{authUse}}
const server = app.listen({ port: 3000 });
console.log(`🚀 Server running at http://localhost:${server.port}`);
