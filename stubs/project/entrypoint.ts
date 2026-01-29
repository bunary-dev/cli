import { createApp } from "@bunary/http";
import { registerRoutes } from "./routes/index.js";

// createApp() supports { basePath: "/api" } to prefix all routes
const app = createApp();
registerRoutes(app);

const server = app.listen({ port: 3000 });
console.log(`🚀 Server running at http://localhost:${server.port}`);
