import { createRoute } from "@hono/zod-openapi";
import { createUserBody, createUserResponse } from "./user.schema";
import { zValidator } from "@hono/zod-validator";

const createUserRoute = createRoute({
  method: "post",
  path: "/user",
  tags: ["User"],
  summary: "Create a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createUserBody,
        },
      },
    },
  },
  middleware: [zValidator("json", createUserBody)] as const,
  responses: {
    201: {
      content: {
        "application/json": {
          schema: createUserResponse,
        },
      },
      description: "OK",
    },
  },
});

export { createUserRoute };
