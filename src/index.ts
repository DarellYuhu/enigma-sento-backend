import app from "./app";
import { config } from "./config";

Bun.serve({
  fetch: app.fetch,
  port: config.PORT,
});

console.log(`Listening on http://localhost:${config.PORT}`);
