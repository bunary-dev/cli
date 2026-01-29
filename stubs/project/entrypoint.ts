import { createApp } from "@bunary/http";
import { registerRoutes } from "./routes/index.js";

const app = createApp();
registerRoutes(app);

const server = app.listen(3000);
console.log(`🚀 Server running at http://localhost:${server.port}`);
