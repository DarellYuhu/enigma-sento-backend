import { OpenAPIHono } from "@hono/zod-openapi";
import { createWorkgroupUserRoute } from "./workgroup-user.route";
import { addWorkgroupUser } from "./workgroup-user.service";

const workgroupUser = new OpenAPIHono();

workgroupUser.openapi(createWorkgroupUserRoute, async (c) => {
  const { id } = c.req.param();
  const payload = c.req.valid("json");
  const data = await addWorkgroupUser(payload.users, id);
  return c.json({ data, message: "Users added to workgroup" }, 201);
});

export default workgroupUser;
