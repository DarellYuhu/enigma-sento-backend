import { createRoute, z } from "@hono/zod-openapi";
import {
  createWorkgroupUserBody,
  createWorkgroupUserResponse,
  getWorkgroupUsersResponse,
} from "./workgroup-user.schema";
import { jwt } from "hono/jwt";
import { config } from "@/config";
import { rbacMiddleware } from "@/middlewares/rbacMiddleware";

const createWorkgroupUserRoute = createRoute({
  tags: ["Workgroup User"],
  method: "post",
  path: "/workgroups/{id}/users",
  summary: "Add users to workgroup",
  middleware: [
    jwt({ secret: config.JWT_SECRET }),
    rbacMiddleware(["MANAGER"]),
  ] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: createWorkgroupUserBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "OK",
      content: {
        "application/json": {
          schema: createWorkgroupUserResponse,
        },
      },
    },
  },
});

const getWorkgroupUsersRoute = createRoute({
  method: "get",
  path: "/workgroups/{id}/users",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: getWorkgroupUsersResponse,
        },
      },
    },
  },
});

export { createWorkgroupUserRoute, getWorkgroupUsersRoute };
