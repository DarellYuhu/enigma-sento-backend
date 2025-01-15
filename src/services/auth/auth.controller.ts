import { signIn } from "./auth.service";
import { OpenAPIHono } from "@hono/zod-openapi";
import { loginRoute } from "./auth.route";

const auth = new OpenAPIHono();

auth.openapi(loginRoute, async (c) => {
  const data = await signIn(c.req.valid("json"));
  return c.json({ message: "ok", data }, 200);
});

export default auth;
