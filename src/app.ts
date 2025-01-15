import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { logger } from "hono/logger";
import {
  auth,
  groupDistribution,
  user,
  workgroup,
  workgroupUser,
} from "./services";

const app = new OpenAPIHono();

app.use(logger());

app.route("", auth);
app.route("", user);
app.route("", workgroup);
app.route("", workgroupUser);
app.route("", groupDistribution);

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

export default app;
