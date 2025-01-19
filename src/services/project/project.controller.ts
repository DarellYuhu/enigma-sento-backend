import { OpenAPIHono } from "@hono/zod-openapi";
import { createProjectRoute } from "./project.route";
import { createProject } from "./project.service";

const project = new OpenAPIHono();

project.openapi(createProjectRoute, async (c) => {
  const payload = c.req.valid("json");
  const data = await createProject(payload);
  return c.json({ message: "Project created successfully", data });
});

export default project;
