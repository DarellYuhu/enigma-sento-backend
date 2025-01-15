import { createRoute } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { signInBody, signInResponse } from "./auth.schema";

const loginRoute = createRoute({
  tags: ["Auth"],
  method: "post",
  middleware: [zValidator("json", signInBody)],
  path: "/auth/sign-in",
  summary: "Sign in a user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: signInBody,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: signInResponse,
        },
      },
      description: "OK",
    },
  },
});

export { loginRoute };
