import { OpenAPIHono } from "@hono/zod-openapi";
import { createProjectRoute, getProjectsRoute } from "./project.route";
import { createProject, getProjects } from "./project.service";
import type { TokenPayload } from "@/types";

const project = new OpenAPIHono();

project.openapi(createProjectRoute, async (c) => {
  const jwtPayload: TokenPayload = c.get("jwtPayload");
  const payload = c.req.valid("json");
  const data = await createProject(payload, jwtPayload.sub);
  return c.json({ message: "Project created successfully", data });
});

project.openapi(getProjectsRoute, async (c) => {
  const { workgroupId } = c.req.param();
  const jwtPayload: TokenPayload = c.get("jwtPayload");
  const data = await getProjects(workgroupId, jwtPayload.sub);
  return c.json({ message: "ok", data });
});

export default project;
