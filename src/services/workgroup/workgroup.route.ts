import { createRoute, z } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import {
  createWorkgroupBody,
  createWorkgroupResponse,
  getWorkgroupsResponse,
  getWorkgroupUserTasksResponse,
} from "./workgroup.schema";
import { config } from "@/config";
import { rbacMiddleware } from "@/middlewares/rbacMiddleware";

const createWorkgroupRoute = createRoute({
  method: "post",
  path: "/workgroups",
  tags: ["Workgroup"],
  middleware: [jwt({ secret: config.JWT_SECRET })] as const,
  summary: "Create a new workgroup",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createWorkgroupBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "OK",
      summary: "Create a new workgroup",
      content: {
        "application/json": {
          schema: createWorkgroupResponse,
        },
      },
    },
  },
});

const getWorkgroupsRoute = createRoute({
  method: "get",
  path: "/workgroups",
  tags: ["Workgroup"],
  middleware: [jwt({ secret: config.JWT_SECRET })] as const,
  summary: "Get all workgroups",
  responses: {
    200: {
      description: "OK",
      summary: "Get all workgroups",
      content: {
        "application/json": {
          schema: getWorkgroupsResponse,
        },
      },
    },
  },
});

const getWorkgroupUserTasksRoute = createRoute({
  method: "get",
  path: "/workgroups/{id}/user-tasks",
  tags: ["Workgroup"],
  middleware: [jwt({ secret: config.JWT_SECRET })] as const,
  summary: "Get all workgroup user tasks",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "OK",
      summary: "Get all workgroup user tasks",
      content: {
        "application/json": {
          schema: getWorkgroupUserTasksResponse,
        },
      },
    },
  },
});

const getWorkgroupByIdRoute = createRoute({
  method: "get",
  path: "/workgroups/{id}",
  tags: ["Workgroup"],
  middleware: [jwt({ secret: config.JWT_SECRET })] as const,
  summary: "Get workgroup by id",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "OK",
      summary: "Get workgroup by id",
      content: {
        "application/json": {
          schema: createWorkgroupResponse,
        },
      },
    },
  },
});

const deleteWorkgroupUserRoute = createRoute({
  method: "delete",
  path: "/workgroups/{workgroupId}/users/{userId}",
  tags: ["Workgroup"],
  middleware: [
    jwt({ secret: config.JWT_SECRET }),
    rbacMiddleware(["MANAGER"]),
  ] as const,
  summary: "Delete workgroup user",
  request: {
    params: z.object({
      workgroupId: z.string(),
      userId: z.string(),
    }),
  },
  responses: {
    204: {
      description: "OK",
    },
  },
});

export {
  createWorkgroupRoute,
  getWorkgroupsRoute,
  getWorkgroupUserTasksRoute,
  getWorkgroupByIdRoute,
  deleteWorkgroupUserRoute,
};
