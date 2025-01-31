import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createProjectRoute,
  deleteProjectRoute,
  getProjectsRoute,
} from "./project.route";
import { createProject, deleteProject, getProjects } from "./project.service";
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

project.openapi(deleteProjectRoute, async (c) => {
  const { projectId } = c.req.param();
  await deleteProject(projectId);
  return c.json({ message: "Project deleted" });
});

export default project;
