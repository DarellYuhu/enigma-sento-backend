import app from "./server";

const port = process.env.PORT || 3000;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`Listening on http://localhost:${port}`);
