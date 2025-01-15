import { OpenAPIHono } from "@hono/zod-openapi";
import { createUserRoute } from "./user.route";
import { createUser } from "./user.service";

const user = new OpenAPIHono();

user.openapi(createUserRoute, async (c) => {
  const paylaod = c.req.valid("json");
  const data = await createUser(paylaod);
  return c.json({ message: "ok", data }, 201);
});

export default user;
