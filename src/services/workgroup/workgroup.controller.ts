import { OpenAPIHono } from "@hono/zod-openapi";
import { createWorkgroupRoute } from "./workgroup.route";
import { createWorkgroup } from "./workgroup.service";
import type { TokenPayload } from "@/types";

const workgroup = new OpenAPIHono();

workgroup.openapi(createWorkgroupRoute, async (c) => {
  const jwtPayload: TokenPayload = c.get("jwtPayload");
  const payload = c.req.valid("json");
  const data = await createWorkgroup({ ...payload, managerId: jwtPayload.sub });
  return c.json({ message: "Workgroup created", data }, 201);
});

export default workgroup;
