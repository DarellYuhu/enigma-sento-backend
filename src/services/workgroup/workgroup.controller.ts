import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createWorkgroupRoute,
  deleteWorkgroupUserRoute,
  getWorkgroupByIdRoute,
  getWorkgroupsRoute,
  getWorkgroupUserTasksRoute,
} from "./workgroup.route";
import {
  createWorkgroup,
  deleteWorkgroupUser,
  getWorkgroupById,
  getWorkgroups,
  getWorkgroupUserTasks,
} from "./workgroup.service";
import type { TokenPayload } from "@/types";
import { HTTPException } from "hono/http-exception";
import { getWorkgroupUsersRoute } from "../workgroup-user/workgroup-user.route";
import { getWorkgroupUser } from "../workgroup-user/workgroup-user.service";

const workgroup = new OpenAPIHono();

workgroup.openapi(createWorkgroupRoute, async (c) => {
  const jwtPayload: TokenPayload = c.get("jwtPayload");
  if (jwtPayload.role !== "MANAGER")
    throw new HTTPException(403, { message: "Forbiden" });
  const payload = c.req.valid("json");
  const data = await createWorkgroup({ ...payload, managerId: jwtPayload.sub });
  return c.json({ message: "Workgroup created", data }, 201);
});

workgroup.openapi(getWorkgroupsRoute, async (c) => {
  const jwtPayload: TokenPayload = c.get("jwtPayload");
  const data = await getWorkgroups(jwtPayload.sub);
  return c.json({ message: "ok", data });
});

workgroup.openapi(getWorkgroupUsersRoute, async (c) => {
  const { id } = c.req.param();
  const data = await getWorkgroupUser(id);
  return c.json({ message: "ok", data });
});

workgroup.openapi(getWorkgroupUserTasksRoute, async (c) => {
  const { id } = c.req.param();
  const data = await getWorkgroupUserTasks(id);
  return c.json({ message: "ok", data });
});

workgroup.openapi(getWorkgroupByIdRoute, async (c) => {
  const { id } = c.req.param();
  const data = await getWorkgroupById(id);
  if (!data) throw new HTTPException(404, { message: "Workgroup not found" });
  return c.json({ data, message: "ok" });
});

workgroup.openapi(deleteWorkgroupUserRoute, async (c) => {
  const { userId, workgroupId } = c.req.valid("param");
  await deleteWorkgroupUser(workgroupId, userId);
  return c.json({ message: "ok" });
});

export default workgroup;
