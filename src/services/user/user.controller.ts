import { OpenAPIHono } from "@hono/zod-openapi";
import { createUserRoute, getUsersRoute } from "./user.route";
import { createUser, getUsers } from "./user.service";

const user = new OpenAPIHono();

user.openapi(createUserRoute, async (c) => {
  const paylaod = c.req.valid("json");
  const data = await createUser(paylaod);
  return c.json({ message: "ok", data }, 201);
});

user.openapi(getUsersRoute, async (c) => {
  const data = await getUsers();
  return c.json({ message: "ok", data });
});

export default user;
