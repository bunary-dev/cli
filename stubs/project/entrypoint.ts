import { createApp } from "{{bunaryHttp}}";
import { registerRoutes } from "./routes/index.js";
{{authImport}}
// createApp<TLocals>() accepts a generic for typed per-request data:
//   const app = createApp<{ user: User }>();
//   ctx.locals.user   // typed in handlers and middleware
//
// You can also pass options:
//   createApp({ basePath: "/api" })    — prefix all routes
//   createApp({ onNotFound: (ctx) => ... })  — custom 404 handler
const app = createApp();
registerRoutes(app);
{{authUse}}
const server = app.listen({ port: 3000 });
console.log(`🚀 Server running at http://localhost:${server.port}`);
