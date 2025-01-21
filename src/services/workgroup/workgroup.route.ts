import { createRoute } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import {
  createWorkgroupBody,
  createWorkgroupResponse,
  getWorkgroupsResponse,
} from "./workgroup.schema";
import { config } from "@/config";

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

export { createWorkgroupRoute, getWorkgroupsRoute };
