import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { loginSchema } from "./schema";
import { signIn } from "./service";

const auth = new Hono();

auth.post("/sign-in", zValidator("json", loginSchema), async (c) => {
  const data = await signIn(c.req.valid("json"));

  return c.json({ messasge: "ok", data });
});

export default auth;
