import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { logger } from "hono/logger";
import {
  asset,
  auth,
  contentDistribution,
  groupDistribution,
  project,
  storage,
  story,
  user,
  workgroup,
  workgroupUser,
} from "./services";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { config } from "./config";

const app = new OpenAPIHono();

app.use(logger());
app.use(
  cors({
    origin: config.ALLOWED_ORIGINS.split(","),
    exposeHeaders: ["Content-Disposition"],
  })
);

app.route("", asset);
app.route("", auth);
app.route("", contentDistribution);
app.route("", groupDistribution);
app.route("", project);
app.route("", story);
app.route("", storage);
app.route("", user);
app.route("", workgroup);
app.route("", workgroupUser);

app.doc("/docs", {
  openapi: "3.0.0",
  info: {
    title: "Enigma Sento API",
    version: "1.0.0",
  },
});
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

app.get(
  "/api",
  apiReference({ spec: { url: "/docs" }, theme: "saturn", layout: "classic" })
);
app.get("/api-swagger", swaggerUI({ url: "/docs" }));

export default app;
