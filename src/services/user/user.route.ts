import { createRoute } from "@hono/zod-openapi";
import {
  createUserBody,
  createUserResponse,
  getUsersResponse,
} from "./user.schema";
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

const getUsersRoute = createRoute({
  method: "get",
  path: "/users",
  tags: ["User"],
  summary: "Get all users",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: getUsersResponse,
        },
      },
    },
  },
});

export { createUserRoute, getUsersRoute };
