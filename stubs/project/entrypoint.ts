import { createApp } from "@bunary/http";

const app = createApp();

app.get("/", () => ({
  message: "Welcome to Bunary!",
  docs: "https://github.com/bunary-dev",
}));

app.get("/health", () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

const server = app.listen(3000);
console.log(`🚀 Server running at http://localhost:${server.port}`);
