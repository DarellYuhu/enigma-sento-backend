import { OpenAPIHono } from "@hono/zod-openapi";
import { createWorkgroupRoute } from "./workgroup.route";
import { createWorkgroup } from "./workgroup.service";
import type { TokenPayload } from "@/types";
import { HTTPException } from "hono/http-exception";

const workgroup = new OpenAPIHono();

workgroup.openapi(createWorkgroupRoute, async (c) => {
  const jwtPayload: TokenPayload = c.get("jwtPayload");
  if (jwtPayload.role !== "MANAGER")
    throw new HTTPException(403, { message: "Forbiden" });
  const payload = c.req.valid("json");
  const data = await createWorkgroup({ ...payload, managerId: jwtPayload.sub });
  return c.json({ message: "Workgroup created", data }, 201);
});

export default workgroup;
