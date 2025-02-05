import app from "./app";
import { config } from "./config";
import { connectMongo } from "./db";

const startServer = async () => {
  try {
    await connectMongo();

    Bun.serve({
      fetch: app.fetch,
      port: config.PORT,
    });

    console.log(`Listening on http://localhost:${config.PORT}`);
  } catch (error) {
    console.error(error);
  }
};

startServer();
